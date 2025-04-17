import { users, type User, type InsertUser, events, type Event, type InsertEvent, leads, type Lead, type InsertLead } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Event methods
  getEvents(userId: number): Promise<Event[]>;
  getEvent(id: number, userId: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  
  // Lead methods
  getLeads(userId: number): Promise<Lead[]>;
  getLeadsByEvent(eventId: number): Promise<Lead[]>;
  getLead(id: number): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<Lead>): Promise<Lead | undefined>;
  deleteLead(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private events: Map<number, Event>;
  private leads: Map<number, Lead>;
  private userIdCounter: number;
  private eventIdCounter: number;
  private leadIdCounter: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.events = new Map();
    this.leads = new Map();
    this.userIdCounter = 1;
    this.eventIdCounter = 1;
    this.leadIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    // Create sample data
    this.initSampleData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Event methods
  async getEvents(userId: number): Promise<Event[]> {
    return Array.from(this.events.values()).filter(
      (event) => event.userId === userId
    );
  }

  async getEvent(id: number, userId: number): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (event && event.userId === userId) {
      return event;
    }
    return undefined;
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.eventIdCounter++;
    const event: Event = { 
      ...insertEvent, 
      id, 
      leadCount: 0,
      todayLeadCount: 0
    };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: number, eventUpdate: Partial<Event>): Promise<Event | undefined> {
    const existingEvent = this.events.get(id);
    if (!existingEvent) return undefined;

    const updatedEvent = { ...existingEvent, ...eventUpdate };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    return this.events.delete(id);
  }

  // Lead methods
  async getLeads(userId: number): Promise<Lead[]> {
    return Array.from(this.leads.values()).filter(
      (lead) => lead.userId === userId
    );
  }

  async getLeadsByEvent(eventId: number): Promise<Lead[]> {
    return Array.from(this.leads.values()).filter(
      (lead) => lead.eventId === eventId
    );
  }

  async getLead(id: number): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = this.leadIdCounter++;
    const lead: Lead = { 
      ...insertLead, 
      id,
      createdAt: new Date()
    };
    this.leads.set(id, lead);
    
    // Update event lead counts
    const event = this.events.get(insertLead.eventId);
    if (event) {
      const today = new Date();
      const leadDate = lead.createdAt;
      const isToday = 
        leadDate.getDate() === today.getDate() &&
        leadDate.getMonth() === today.getMonth() &&
        leadDate.getFullYear() === today.getFullYear();
      
      event.leadCount += 1;
      if (isToday) {
        event.todayLeadCount += 1;
      }
      this.events.set(event.id, event);
    }
    
    return lead;
  }

  async updateLead(id: number, leadUpdate: Partial<Lead>): Promise<Lead | undefined> {
    const existingLead = this.leads.get(id);
    if (!existingLead) return undefined;

    const updatedLead = { ...existingLead, ...leadUpdate };
    this.leads.set(id, updatedLead);
    return updatedLead;
  }

  async deleteLead(id: number): Promise<boolean> {
    const lead = this.leads.get(id);
    if (!lead) return false;
    
    // Update event lead count
    const event = this.events.get(lead.eventId);
    if (event) {
      event.leadCount = Math.max(0, event.leadCount - 1);
      
      const today = new Date();
      const leadDate = lead.createdAt;
      const isToday = 
        leadDate.getDate() === today.getDate() &&
        leadDate.getMonth() === today.getMonth() &&
        leadDate.getFullYear() === today.getFullYear();
      
      if (isToday) {
        event.todayLeadCount = Math.max(0, event.todayLeadCount - 1);
      }
      this.events.set(event.id, event);
    }
    
    return this.leads.delete(id);
  }
  
  // Helper methods for initializing sample data
  private initSampleData() {
    // This is just for setup and no sample data will be created
    // Actual data will be created by users through the application
  }
}

export const storage = new MemStorage();
