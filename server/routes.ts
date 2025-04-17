import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertEventSchema, insertLeadSchema, insertEventAttendeeSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import * as Papa from "papaparse";
import fs from "fs";
import { scoreLead } from "./openai";

// Set up file upload middleware
const upload = multer({ dest: "uploads/" });

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Event routes
  app.get("/api/events", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    
    try {
      const events = await storage.getEvents(userId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    const eventId = parseInt(req.params.id);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }
    
    try {
      const event = await storage.getEvent(eventId, userId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  app.post("/api/events", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    
    try {
      const eventData = { ...req.body, userId };
      const validatedData = insertEventSchema.parse(eventData);
      const event = await storage.createEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create event" });
      }
    }
  });

  app.put("/api/events/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    const eventId = parseInt(req.params.id);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }
    
    try {
      const existingEvent = await storage.getEvent(eventId, userId);
      if (!existingEvent) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      const updatedEvent = await storage.updateEvent(eventId, req.body);
      res.json(updatedEvent);
    } catch (error) {
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    const eventId = parseInt(req.params.id);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }
    
    try {
      const existingEvent = await storage.getEvent(eventId, userId);
      if (!existingEvent) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      const deleted = await storage.deleteEvent(eventId);
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(500).json({ error: "Failed to delete event" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  // Lead routes
  app.get("/api/leads", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    
    try {
      const leads = await storage.getLeads(userId);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.get("/api/events/:id/leads", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    const eventId = parseInt(req.params.id);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }
    
    try {
      const event = await storage.getEvent(eventId, userId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      const leads = await storage.getLeadsByEvent(eventId);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.get("/api/leads/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const leadId = parseInt(req.params.id);
    
    if (isNaN(leadId)) {
      return res.status(400).json({ error: "Invalid lead ID" });
    }
    
    try {
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      
      // Check if the lead belongs to the user
      if (lead.userId !== req.user!.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      res.json(lead);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lead" });
    }
  });

  app.post("/api/events/:id/leads", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    const eventId = parseInt(req.params.id);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }
    
    try {
      const event = await storage.getEvent(eventId, userId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      const leadData = { ...req.body, eventId, userId };
      const validatedData = insertLeadSchema.parse(leadData);
      const lead = await storage.createLead(validatedData);
      
      // Asynchronously score the lead using OpenAI
      try {
        const aiScoring = await scoreLead(lead);
        await storage.updateLead(lead.id, {
          score: aiScoring.score,
          aiScoreExplanation: aiScoring.explanation,
          aiSimilarityScore: aiScoring.similarityScore.toString()
        });
      } catch (aiError) {
        console.error("Error scoring lead with AI:", aiError);
        // If AI scoring fails, we don't want to fail the entire request
      }
      
      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create lead" });
      }
    }
  });

  app.put("/api/leads/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    const leadId = parseInt(req.params.id);
    
    if (isNaN(leadId)) {
      return res.status(400).json({ error: "Invalid lead ID" });
    }
    
    try {
      const existingLead = await storage.getLead(leadId);
      if (!existingLead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      
      // Check if the lead belongs to the user
      if (existingLead.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const updatedLead = await storage.updateLead(leadId, req.body);
      res.json(updatedLead);
    } catch (error) {
      res.status(500).json({ error: "Failed to update lead" });
    }
  });

  app.delete("/api/leads/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    const leadId = parseInt(req.params.id);
    
    if (isNaN(leadId)) {
      return res.status(400).json({ error: "Invalid lead ID" });
    }
    
    try {
      const existingLead = await storage.getLead(leadId);
      if (!existingLead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      
      // Check if the lead belongs to the user
      if (existingLead.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const deleted = await storage.deleteLead(leadId);
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(500).json({ error: "Failed to delete lead" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete lead" });
    }
  });

  // CSV Import endpoints
  app.post("/api/leads/import", upload.single("file"), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    
    try {
      const fileContent = fs.readFileSync(req.file.path, "utf8");
      const result = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
      
      if (result.errors.length > 0) {
        return res.status(400).json({
          error: "CSV parsing errors",
          details: result.errors
        });
      }
      
      const leads = result.data.filter(
        (row: any) => row.firstName && row.lastName && row.email
      );
      
      if (leads.length === 0) {
        return res.status(400).json({ error: "No valid leads found in CSV" });
      }
      
      const importedLeads = [];
      for (const leadData of leads) {
        try {
          // Type casting and validation
          const data: Record<string, any> = leadData as Record<string, any>;
          
          const leadRecord = {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone || null,
            title: data.title || null,
            company: data.company || null,
            notes: data.notes || null,
            score: data.score || "medium",
            source: "csv-import",
            userId,
            eventId: data.eventId || 0
          };
          
          const lead = await storage.createLead(leadRecord);
          importedLeads.push(lead);
        } catch (err) {
          console.error("Error importing lead:", err);
        }
      }
      
      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);
      
      res.status(201).json({ 
        imported: importedLeads.length,
        total: leads.length 
      });
    } catch (err) {
      console.error("Error processing CSV import:", err);
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      res.status(500).json({ error: "Error processing CSV file" });
    }
  });
  
  app.post("/api/events/:id/leads/import", upload.single("file"), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    
    const eventId = parseInt(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }
    
    try {
      const event = await storage.getEvent(eventId, userId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      const fileContent = fs.readFileSync(req.file.path, "utf8");
      const result = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
      
      if (result.errors.length > 0) {
        return res.status(400).json({
          error: "CSV parsing errors",
          details: result.errors
        });
      }
      
      const leads = result.data.filter(
        (row: any) => row.firstName && row.lastName && row.email
      );
      
      if (leads.length === 0) {
        return res.status(400).json({ error: "No valid leads found in CSV" });
      }
      
      const importedLeads = [];
      for (const leadData of leads) {
        try {
          // Type casting and validation
          const data: Record<string, any> = leadData as Record<string, any>;
          
          const leadRecord = {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone || null,
            title: data.title || null,
            company: data.company || null,
            notes: data.notes || null,
            score: data.score || "medium",
            source: "csv-import",
            userId,
            eventId
          };
          
          const lead = await storage.createLead(leadRecord);
          importedLeads.push(lead);
        } catch (err) {
          console.error("Error importing lead:", err);
        }
      }
      
      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);
      
      res.status(201).json({ 
        imported: importedLeads.length,
        total: leads.length 
      });
    } catch (err) {
      console.error("Error processing CSV import:", err);
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      res.status(500).json({ error: "Error processing CSV file" });
    }
  });

  // AI Lead Scoring endpoint
  app.post("/api/leads/:id/score", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    const leadId = parseInt(req.params.id);
    
    if (isNaN(leadId)) {
      return res.status(400).json({ error: "Invalid lead ID" });
    }
    
    try {
      const existingLead = await storage.getLead(leadId);
      if (!existingLead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      
      // Check if the lead belongs to the user
      if (existingLead.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      // Get event to check for custom scoring criteria
      const event = await storage.getEvent(existingLead.eventId, userId);
      
      // Score the lead with AI, using event-specific criteria if available
      const aiScoring = await scoreLead(existingLead, event?.leadScoringCriteria || undefined);
      const updatedLead = await storage.updateLead(leadId, {
        score: aiScoring.score,
        aiScoreExplanation: aiScoring.explanation,
        aiSimilarityScore: aiScoring.similarityScore.toString()
      });
      
      res.json({
        success: true,
        lead: updatedLead,
        scoring: {
          score: aiScoring.score,
          explanation: aiScoring.explanation,
          similarityScore: Math.round(aiScoring.similarityScore * 100) / 100
        }
      });
    } catch (error) {
      console.error("Error scoring lead:", error);
      res.status(500).json({ error: "Failed to score lead" });
    }
  });
  
  // Event Attendees routes
  app.get("/api/events/:id/attendees", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    const eventId = parseInt(req.params.id);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }
    
    try {
      const event = await storage.getEvent(eventId, userId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      const attendees = await storage.getEventAttendees(eventId);
      res.json(attendees);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event attendees" });
    }
  });

  app.get("/api/attendees/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const attendeeId = parseInt(req.params.id);
    
    if (isNaN(attendeeId)) {
      return res.status(400).json({ error: "Invalid attendee ID" });
    }
    
    try {
      const attendee = await storage.getEventAttendee(attendeeId);
      if (!attendee) {
        return res.status(404).json({ error: "Attendee not found" });
      }
      
      // Verify the user has access to the event
      const event = await storage.getEvent(attendee.eventId, req.user!.id);
      if (!event) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      res.json(attendee);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attendee" });
    }
  });

  app.post("/api/events/:id/attendees", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    const eventId = parseInt(req.params.id);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }
    
    try {
      const event = await storage.getEvent(eventId, userId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      const attendeeData = { ...req.body, eventId };
      const validatedData = insertEventAttendeeSchema.parse(attendeeData);
      const attendee = await storage.createEventAttendee(validatedData);
      
      res.status(201).json(attendee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create event attendee" });
      }
    }
  });

  app.put("/api/attendees/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    const attendeeId = parseInt(req.params.id);
    
    if (isNaN(attendeeId)) {
      return res.status(400).json({ error: "Invalid attendee ID" });
    }
    
    try {
      const existingAttendee = await storage.getEventAttendee(attendeeId);
      if (!existingAttendee) {
        return res.status(404).json({ error: "Attendee not found" });
      }
      
      // Verify the user has access to the event
      const event = await storage.getEvent(existingAttendee.eventId, userId);
      if (!event) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const updatedAttendee = await storage.updateEventAttendee(attendeeId, req.body);
      res.json(updatedAttendee);
    } catch (error) {
      res.status(500).json({ error: "Failed to update attendee" });
    }
  });

  app.delete("/api/attendees/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    const attendeeId = parseInt(req.params.id);
    
    if (isNaN(attendeeId)) {
      return res.status(400).json({ error: "Invalid attendee ID" });
    }
    
    try {
      const existingAttendee = await storage.getEventAttendee(attendeeId);
      if (!existingAttendee) {
        return res.status(404).json({ error: "Attendee not found" });
      }
      
      // Verify the user has access to the event
      const event = await storage.getEvent(existingAttendee.eventId, userId);
      if (!event) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const deleted = await storage.deleteEventAttendee(attendeeId);
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(500).json({ error: "Failed to delete attendee" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete attendee" });
    }
  });

  // Batch Lead Scoring endpoint
  app.post("/api/events/:id/leads/score", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    const eventId = parseInt(req.params.id);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }
    
    try {
      const event = await storage.getEvent(eventId, userId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      const leads = await storage.getLeadsByEvent(eventId);
      
      // Process leads in batches to avoid overwhelming the API
      const results = {
        total: leads.length,
        processed: 0,
        high: 0,
        medium: 0,
        low: 0,
        failed: 0
      };
      
      // Process in smaller batches to avoid rate limits
      const batchSize = 5;
      for (let i = 0; i < leads.length; i += batchSize) {
        const batch = leads.slice(i, i + batchSize);
        
        // Process each lead in the batch
        const batchPromises = batch.map(async (lead) => {
          try {
            // Use event-specific criteria for scoring
            const aiScoring = await scoreLead(lead, event.leadScoringCriteria || undefined);
            await storage.updateLead(lead.id, {
              score: aiScoring.score,
              aiScoreExplanation: aiScoring.explanation,
              aiSimilarityScore: aiScoring.similarityScore.toString()
            });
            
            results.processed++;
            if (aiScoring.score === "high") results.high++;
            else if (aiScoring.score === "medium") results.medium++;
            else results.low++;
            
            return true;
          } catch (error) {
            console.error(`Error scoring lead ${lead.id}:`, error);
            results.failed++;
            return false;
          }
        });
        
        // Wait for the current batch to complete before moving to the next
        await Promise.all(batchPromises);
      }
      
      res.json({
        success: true,
        results
      });
    } catch (error) {
      console.error("Error batch scoring leads:", error);
      res.status(500).json({ error: "Failed to score leads" });
    }
  });

  // Update event lead scoring criteria endpoint
  app.post("/api/events/:id/scoring-criteria", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    const eventId = parseInt(req.params.id);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }
    
    try {
      const event = await storage.getEvent(eventId, userId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      // Validate request body
      const criteria = req.body.criteria;
      if (!criteria || typeof criteria !== "string") {
        return res.status(400).json({ error: "Invalid criteria. Please provide a text description of what makes a lead valuable." });
      }
      
      // Update event with new criteria
      const updatedEvent = await storage.updateEvent(eventId, {
        leadScoringCriteria: criteria
      });
      
      res.json({
        success: true,
        event: updatedEvent
      });
    } catch (error) {
      console.error("Error updating scoring criteria:", error);
      res.status(500).json({ error: "Failed to update scoring criteria" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}