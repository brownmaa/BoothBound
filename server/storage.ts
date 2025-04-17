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
  
  // Event Attendee methods
  getEventAttendees(eventId: number): Promise<EventAttendee[]>;
  getEventAttendee(id: number): Promise<EventAttendee | undefined>;
  createEventAttendee(attendee: InsertEventAttendee): Promise<EventAttendee>;
  updateEventAttendee(id: number, attendee: Partial<EventAttendee>): Promise<EventAttendee | undefined>;
  deleteEventAttendee(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private events: Map<number, Event>;
  private leads: Map<number, Lead>;
  private eventAttendees: Map<number, EventAttendee>;
  private userIdCounter: number;
  private eventIdCounter: number;
  private leadIdCounter: number;
  private eventAttendeeIdCounter: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.events = new Map();
    this.leads = new Map();
    this.eventAttendees = new Map();
    this.userIdCounter = 1;
    this.eventIdCounter = 1;
    this.leadIdCounter = 1;
    this.eventAttendeeIdCounter = 1;
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
  
  // Event Attendee methods
  async getEventAttendees(eventId: number): Promise<EventAttendee[]> {
    return Array.from(this.eventAttendees.values()).filter(
      (attendee) => attendee.eventId === eventId
    );
  }
  
  async getEventAttendee(id: number): Promise<EventAttendee | undefined> {
    return this.eventAttendees.get(id);
  }
  
  async createEventAttendee(insertAttendee: InsertEventAttendee): Promise<EventAttendee> {
    const id = this.eventAttendeeIdCounter++;
    const attendee: EventAttendee = {
      ...insertAttendee,
      id,
      createdAt: new Date(),
    };
    this.eventAttendees.set(id, attendee);
    return attendee;
  }
  
  async updateEventAttendee(id: number, attendeeUpdate: Partial<EventAttendee>): Promise<EventAttendee | undefined> {
    const existingAttendee = this.eventAttendees.get(id);
    if (!existingAttendee) return undefined;
    
    const updatedAttendee = { ...existingAttendee, ...attendeeUpdate };
    this.eventAttendees.set(id, updatedAttendee);
    return updatedAttendee;
  }
  
  async deleteEventAttendee(id: number): Promise<boolean> {
    return this.eventAttendees.delete(id);
  }
  
  // Helper methods for initializing sample data
  private initSampleData() {
    // Create sample attendees
    const initEventAttendees = () => {
      // Sample attendees for TechExpo
      const techExpoAttendees: EventAttendee[] = [
        {
          id: 1,
          eventId: 1,
          name: "Sarah Johnson",
          email: "sarah.johnson@boothbound.com",
          role: "Sales Rep",
          notes: "Handling product demos",
          isActive: true,
          createdAt: new Date("2025-05-01T10:00:00")
        },
        {
          id: 2,
          eventId: 1,
          name: "Michael Brown",
          email: "michael.brown@boothbound.com",
          role: "Technical Specialist",
          notes: "Answering technical questions",
          isActive: true,
          createdAt: new Date("2025-05-01T10:05:00")
        },
        {
          id: 3,
          eventId: 1,
          name: "David Wilson",
          email: "david.wilson@boothbound.com",
          role: "Sales Manager",
          notes: "Managing the booth schedule",
          isActive: true,
          createdAt: new Date("2025-05-01T10:10:00")
        },
        {
          id: 4,
          eventId: 1,
          name: "Lisa Zhang",
          email: "lisa.zhang@boothbound.com",
          role: "Product Marketing",
          notes: "Handling marketing materials",
          isActive: true,
          createdAt: new Date("2025-05-01T10:15:00")
        }
      ];

      // Sample attendees for Marketing Summit
      const marketingSummitAttendees: EventAttendee[] = [
        {
          id: 5,
          eventId: 2,
          name: "David Wilson",
          email: "david.wilson@boothbound.com",
          role: "Marketing Director",
          notes: "Leading the team",
          isActive: true,
          createdAt: new Date("2025-05-20T14:00:00")
        },
        {
          id: 6,
          eventId: 2,
          name: "Sarah Johnson",
          email: "sarah.johnson@boothbound.com",
          role: "Content Specialist",
          notes: "Handling content distribution",
          isActive: true,
          createdAt: new Date("2025-05-20T14:05:00")
        },
        {
          id: 7,
          eventId: 2,
          name: "Michael Brown",
          email: "michael.brown@boothbound.com",
          role: "Analytics Specialist",
          notes: "Demos of analytics features",
          isActive: true,
          createdAt: new Date("2025-05-20T14:10:00")
        }
      ];

      // Sample attendees for SaaS Connect
      const saasConnectAttendees: EventAttendee[] = [
        {
          id: 8,
          eventId: 3,
          name: "Michael Brown",
          email: "michael.brown@boothbound.com",
          role: "Technical Lead",
          notes: "Handling technical demos",
          isActive: true,
          createdAt: new Date("2025-03-20T09:00:00")
        },
        {
          id: 9,
          eventId: 3,
          name: "Lisa Zhang",
          email: "lisa.zhang@boothbound.com",
          role: "Product Specialist",
          notes: "Product demonstrations",
          isActive: true,
          createdAt: new Date("2025-03-20T09:05:00")
        }
      ];

      const allAttendees = [
        ...techExpoAttendees,
        ...marketingSummitAttendees,
        ...saasConnectAttendees
      ];

      allAttendees.forEach(attendee => {
        this.eventAttendees.set(attendee.id, attendee);
      });

      this.eventAttendeeIdCounter = allAttendees.length + 1;
    };

    // Initialize sample attendees
    initEventAttendees();
    
    // Create a test user if none exists yet
    if (this.users.size === 0) {
      // Using our custom hashing function, the password is "password123"
      const testUser: User = {
        id: 1,
        username: "demo",
        password: "93a4282cd899b4d13830fa206322c7b504e655992d5cb2d86c2233702059b84a105f806935a7dbf25f690dacb23a54909dbcb63142bbe099447f145c93049d61.084108675c18e67c46109234b6dfc59d",
        name: "Demo User",
        email: "demo@example.com",
        company: "BoothBound Inc.",
        role: "Sales Manager",
        avatar: null
      };
      this.users.set(testUser.id, testUser);
      this.userIdCounter = 2;
      
      // Create sample events
      const events: Event[] = [
        {
          id: 1,
          name: "TechExpo 2025",
          description: "Annual technology exhibition showcasing the latest innovations",
          location: "San Francisco Convention Center",
          startDate: new Date("2025-05-15"),
          endDate: new Date("2025-05-17"),
          status: "active",
          leadCount: 8,
          todayLeadCount: 3,
          userId: testUser.id
        },
        {
          id: 2,
          name: "Marketing Summit",
          description: "Conference for marketing professionals",
          location: "Chicago Hilton",
          startDate: new Date("2025-06-10"),
          endDate: new Date("2025-06-12"),
          status: "active",
          leadCount: 5,
          todayLeadCount: 2,
          userId: testUser.id
        },
        {
          id: 3,
          name: "SaaS Connect",
          description: "Networking event for SaaS companies",
          location: "New York Marriott",
          startDate: new Date("2025-04-05"),
          endDate: new Date("2025-04-07"),
          status: "completed",
          leadCount: 12,
          todayLeadCount: 0,
          userId: testUser.id
        }
      ];
      
      events.forEach(event => {
        this.events.set(event.id, event);
      });
      this.eventIdCounter = 4;
      
      // Create sample leads
      const leads: Lead[] = [
        // TechExpo leads
        {
          id: 1,
          firstName: "John",
          lastName: "Smith",
          email: "john.smith@example.com",
          phone: "555-123-4567",
          title: "CTO",
          company: "TechCorp",
          eventId: 1,
          notes: "Interested in enterprise plan",
          score: "high",
          userId: testUser.id,
          employeeName: "Sarah Johnson",
          source: "scan",
          createdAt: new Date("2025-05-15T10:30:00")
        },
        {
          id: 2,
          firstName: "Emily",
          lastName: "Davis",
          email: "emily.davis@example.com",
          phone: "555-234-5678",
          title: "Product Manager",
          company: "InnovateSoft",
          eventId: 1,
          notes: "Looking for integration options",
          score: "medium",
          userId: testUser.id,
          employeeName: "Michael Brown",
          source: "manual",
          createdAt: new Date("2025-05-15T14:15:00")
        },
        {
          id: 3,
          firstName: "Robert",
          lastName: "Wilson",
          email: "robert.wilson@example.com",
          phone: "555-345-6789",
          title: "IT Director",
          company: "Enterprise Solutions",
          eventId: 1,
          notes: "Needs follow-up about security features",
          score: "high",
          userId: testUser.id,
          employeeName: "Sarah Johnson",
          source: "scan",
          createdAt: new Date("2025-05-16T09:45:00")
        },
        {
          id: 4,
          firstName: "Jennifer",
          lastName: "Martinez",
          email: "jennifer.martinez@example.com",
          phone: "555-456-7890",
          title: "Marketing Director",
          company: "Growth Strategies",
          eventId: 1,
          notes: "Interested in analytics capabilities",
          score: "medium",
          userId: testUser.id,
          employeeName: "David Wilson",
          source: "import",
          createdAt: new Date("2025-05-16T11:30:00")
        },
        {
          id: 5,
          firstName: "Michael",
          lastName: "Brown",
          email: "michael.brown@example.com",
          phone: "555-567-8901",
          title: "Sales Director",
          company: "RevenuePlus",
          eventId: 1,
          notes: "Looking for sales automation tools",
          score: "high",
          userId: testUser.id,
          employeeName: "Sarah Johnson",
          source: "scan",
          createdAt: new Date("2025-05-16T15:45:00")
        },
        {
          id: 6,
          firstName: "Jessica",
          lastName: "Taylor",
          email: "jessica.taylor@example.com",
          phone: "555-678-9012",
          title: "CEO",
          company: "StartupX",
          eventId: 1,
          notes: "Potential strategic partnership",
          score: "high",
          userId: testUser.id,
          employeeName: "Michael Brown",
          source: "manual",
          createdAt: new Date("2025-05-17T10:15:00")
        },
        {
          id: 7,
          firstName: "David",
          lastName: "Anderson",
          email: "david.anderson@example.com",
          phone: "555-789-0123",
          title: "Developer Advocate",
          company: "DevTools Inc",
          eventId: 1,
          notes: "Inquired about API documentation. Very interested in integration capabilities. Follow up needed regarding enterprise pricing.",
          score: "medium",
          userId: testUser.id,
          employeeName: "Lisa Zhang",
          source: "scan",
          createdAt: new Date("2025-05-17T13:30:00"),
          linkedIn: "https://linkedin.com/in/johnsmith",
          twitter: "@johnsmith",
          interests: ["API Development", "Developer Tools", "Cloud Infrastructure"],
          budget: "$50k-100k",
          timeline: "Q3 2025",
          followUpDate: new Date("2025-06-01"),
          meetings: [
            {
              date: new Date("2025-05-17T14:00:00"),
              type: "Demo",
              notes: "Showed enterprise features"
            },
            {
              date: new Date("2025-05-17T16:30:00"),
              type: "Technical Discussion",
              notes: "Discussed API limits and SLA requirements"
            }
          ],
          tags: ["Enterprise", "Hot Lead", "Technical Decision Maker"]
        },
        {
          id: 8,
          firstName: "Sarah",
          lastName: "Wilson",
          email: "sarah.wilson@example.com",
          phone: "555-890-1234",
          title: "UX Designer",
          company: "Design Solutions",
          eventId: 1,
          notes: "Provided feedback on UI",
          score: "low",
          userId: testUser.id,
          employeeName: "Lisa Zhang",
          source: "manual",
          createdAt: new Date(new Date().setHours(new Date().getHours() - 1))
        },
        
        // Marketing Summit leads
        {
          id: 9,
          firstName: "Thomas",
          lastName: "Clark",
          email: "thomas.clark@example.com",
          phone: "555-901-2345",
          title: "CMO",
          company: "BrandMasters",
          eventId: 2,
          notes: "Needs case studies",
          score: "high",
          userId: testUser.id,
          employeeName: "David Wilson",
          source: "scan",
          createdAt: new Date(new Date().setHours(new Date().getHours() - 3))
        },
        {
          id: 10,
          firstName: "Amanda",
          lastName: "Lewis",
          email: "amanda.lewis@example.com",
          phone: "555-012-3456",
          title: "Content Strategist",
          company: "ContentWave",
          eventId: 2,
          notes: "Interested in content automation features",
          score: "medium",
          userId: testUser.id,
          employeeName: "Michael Brown",
          source: "import",
          createdAt: new Date(new Date().setHours(new Date().getHours() - 4))
        },
        {
          id: 11,
          firstName: "Brian",
          lastName: "Johnson",
          email: "brian.johnson@example.com",
          phone: "555-123-4567",
          title: "Digital Marketing Manager",
          company: "DigitalEdge",
          eventId: 2,
          notes: "Wants demo of analytics dashboard",
          score: "high",
          userId: testUser.id,
          employeeName: "Sarah Johnson",
          source: "scan",
          createdAt: new Date("2025-06-10T14:30:00")
        },
        {
          id: 12,
          firstName: "Laura",
          lastName: "Roberts",
          email: "laura.roberts@example.com",
          phone: "555-234-5678",
          title: "Email Marketing Specialist",
          company: "EmailPro",
          eventId: 2,
          notes: "Interested in email integration",
          score: "low",
          userId: testUser.id,
          employeeName: "Lisa Zhang",
          source: "manual",
          createdAt: new Date("2025-06-11T09:15:00")
        },
        {
          id: 13,
          firstName: "Kevin",
          lastName: "Miller",
          email: "kevin.miller@example.com",
          phone: "555-345-6789",
          title: "Social Media Manager",
          company: "SocialBoost",
          eventId: 2,
          notes: "Looking for social media analytics",
          score: "medium",
          userId: testUser.id,
          employeeName: "David Wilson",
          source: "scan",
          createdAt: new Date("2025-06-11T16:45:00")
        },
        
        // SaaS Connect leads
        {
          id: 14,
          firstName: "Stephanie",
          lastName: "Adams",
          email: "stephanie.adams@example.com",
          phone: "555-456-7890",
          title: "Product Director",
          company: "CloudServices",
          eventId: 3,
          notes: "Potential integration partner",
          score: "high",
          userId: testUser.id,
          employeeName: "Sarah Johnson",
          source: "scan",
          createdAt: new Date("2025-04-05T11:15:00")
        },
        {
          id: 15,
          firstName: "Daniel",
          lastName: "Garcia",
          email: "daniel.garcia@example.com",
          phone: "555-567-8901",
          title: "VP Engineering",
          company: "TechStack",
          eventId: 3,
          notes: "Discussed technical architecture",
          score: "high",
          userId: testUser.id,
          employeeName: "Michael Brown",
          source: "manual",
          createdAt: new Date("2025-04-05T14:30:00")
        },
        {
          id: 16,
          firstName: "Michelle",
          lastName: "Wong",
          email: "michelle.wong@example.com",
          phone: "555-678-9012",
          title: "CRO",
          company: "GrowthHackers",
          eventId: 3,
          notes: "Interested in pricing strategies",
          score: "medium",
          userId: testUser.id,
          employeeName: "Lisa Zhang",
          source: "scan",
          createdAt: new Date("2025-04-05T16:15:00")
        },
        {
          id: 17,
          firstName: "Christopher",
          lastName: "Baker",
          email: "christopher.baker@example.com",
          phone: "555-789-0123",
          title: "Director of Operations",
          company: "OptiOps",
          eventId: 3,
          notes: "Looking for workflow automation",
          score: "medium",
          userId: testUser.id,
          employeeName: "David Wilson",
          source: "import",
          createdAt: new Date("2025-04-06T09:30:00")
        },
        {
          id: 18,
          firstName: "Rachel",
          lastName: "Evans",
          email: "rachel.evans@example.com",
          phone: "555-890-1234",
          title: "Customer Success Manager",
          company: "ClientFirst",
          eventId: 3,
          notes: "Interested in onboarding automation",
          score: "low",
          userId: testUser.id,
          employeeName: "Sarah Johnson",
          source: "scan",
          createdAt: new Date("2025-04-06T11:45:00")
        },
        {
          id: 19,
          firstName: "Brandon",
          lastName: "Lewis",
          email: "brandon.lewis@example.com",
          phone: "555-901-2345",
          title: "Sales Engineer",
          company: "SalesTech",
          eventId: 3,
          notes: "Technical sales discussion",
          score: "high",
          userId: testUser.id,
          employeeName: "Michael Brown", 
          source: "manual",
          createdAt: new Date("2025-04-06T14:30:00")
        },
        {
          id: 20,
          firstName: "Melissa",
          lastName: "Chen",
          email: "melissa.chen@example.com",
          phone: "555-012-3456",
          title: "Product Marketing Manager",
          company: "MarketMakers",
          eventId: 3,
          notes: "Requested product roadmap",
          score: "medium",
          userId: testUser.id,
          employeeName: "Lisa Zhang",
          source: "scan",
          createdAt: new Date("2025-04-06T16:15:00")
        },
        {
          id: 21,
          firstName: "Joshua",
          lastName: "Kim",
          email: "joshua.kim@example.com",
          phone: "555-123-4567",
          title: "Business Development",
          company: "PartnerPro",
          eventId: 3,
          notes: "Discussed partnership opportunities",
          score: "high",
          userId: testUser.id,
          employeeName: "David Wilson",
          source: "manual",
          createdAt: new Date("2025-04-07T09:30:00")
        },
        {
          id: 22,
          firstName: "Olivia",
          lastName: "Smith",
          email: "olivia.smith@example.com",
          phone: "555-234-5678",
          title: "Marketing Coordinator",
          company: "BrandBoost",
          eventId: 3,
          notes: "Looking for case studies",
          score: "low",
          userId: testUser.id,
          employeeName: "Sarah Johnson",
          source: "scan",
          createdAt: new Date("2025-04-07T11:45:00")
        },
        {
          id: 23,
          firstName: "Ethan",
          lastName: "Davis",
          email: "ethan.davis@example.com",
          phone: "555-345-6789",
          title: "Developer Relations",
          company: "DevConnect",
          eventId: 3,
          notes: "Interested in integration documentation",
          score: "medium",
          userId: testUser.id,
          employeeName: "Michael Brown",
          source: "import",
          createdAt: new Date("2025-04-07T14:15:00")
        },
        {
          id: 24,
          firstName: "Sofia",
          lastName: "Martinez",
          email: "sofia.martinez@example.com",
          phone: "555-456-7890",
          title: "User Research Lead",
          company: "UserInsight",
          eventId: 3,
          notes: "Provided feedback on UX",
          score: "medium",
          userId: testUser.id,
          employeeName: "Lisa Zhang",
          source: "manual",
          createdAt: new Date("2025-04-07T16:30:00")
        },
        {
          id: 25,
          firstName: "William",
          lastName: "Johnson",
          email: "william.johnson@example.com",
          phone: "555-567-8901",
          title: "IT Manager",
          company: "InfoSystems",
          eventId: 3,
          notes: "Security and compliance questions",
          score: "high",
          userId: testUser.id,
          employeeName: "David Wilson",
          source: "scan",
          createdAt: new Date("2025-04-07T17:15:00")
        }
      ];
      
      leads.forEach(lead => {
        this.leads.set(lead.id, lead);
      });
      this.leadIdCounter = 26;
    }
  }
}

export const storage = new MemStorage();
