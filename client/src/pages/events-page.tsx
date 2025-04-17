import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { MobileHeader } from "@/components/mobile-header";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Plus, Calendar, User, ChevronRight, Search } from "lucide-react";
import { Event, insertEventSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Create a custom schema for the event form
const eventFormSchema = insertEventSchema.extend({
  startDate: z.string(),
  endDate: z.string(),
}).refine(data => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start <= end;
}, {
  message: "End date must be after start date",
  path: ["endDate"]
});

type EventFormValues = z.infer<typeof eventFormSchema>;

export default function EventsPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch events
  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });
  
  // Create event form
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: "",
      location: "",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
      status: "upcoming",
    },
  });
  
  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormValues) => {
      const res = await apiRequest("POST", "/api/events", {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Event created",
        description: "Your event has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to create event",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (data: EventFormValues) => {
    createEventMutation.mutate(data);
  };
  
  // Function to format date ranges
  const formatDateRange = (startDate: Date, endDate: Date) => {
    // If same month and year
    if (
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getFullYear() === endDate.getFullYear()
    ) {
      return `${format(startDate, "MMM d")} - ${format(endDate, "d, yyyy")}`;
    }
    // If same year but different months
    else if (startDate.getFullYear() === endDate.getFullYear()) {
      return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
    }
    // Different years
    else {
      return `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`;
    }
  };
  
  // Status badge color mapping
  const statusColors = {
    active: "bg-green-100 text-green-800",
    upcoming: "bg-yellow-100 text-yellow-800",
    completed: "bg-gray-100 text-gray-800",
  };
  
  return (
    <div className="flex flex-col h-screen">
      <MobileHeader title="Events" />
      
      <main className="flex-1 pb-16 md:pb-0 overflow-y-auto">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900">Events</h1>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="inline-flex items-center"
                >
                  <Plus className="h-5 w-5 mr-1" />
                  New Event
                </Button>
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search events..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {isLoading ? (
              <div className="mt-6 space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-3 flex-1">
                          <Skeleton className="h-6 w-1/2" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-4 w-2/3" />
                          </div>
                        </div>
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : events?.length === 0 ? (
              <div className="mt-6 text-center py-12 bg-white rounded-lg shadow">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No events yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new event.</p>
                <div className="mt-6">
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="inline-flex items-center"
                  >
                    <Plus className="h-5 w-5 mr-1" />
                    New Event
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {events
                ?.filter(event => 
                  event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  event.location.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((event) => (
                  <Card key={event.id} className="overflow-hidden">
                    <Link href={`/events/${event.id}`}>
                      <a className="block">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center">
                                <h2 className="text-lg font-medium text-gray-900">{event.name}</h2>
                                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[event.status as keyof typeof statusColors]}`}>
                                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-gray-500">{event.location}</p>
                              <p className="mt-1 text-sm text-gray-500">
                                {formatDateRange(new Date(event.startDate), new Date(event.endDate))}
                              </p>
                              <div className="mt-3 flex items-center text-sm text-gray-500">
                                <User className="flex-shrink-0 mr-1.5 h-4 w-4" />
                                <span>{event.leadCount} leads</span>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </CardContent>
                      </a>
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Create Event Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>
              Add the details for your conference or event.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Event Name</Label>
                <Input 
                  id="name" 
                  placeholder="Tech Conference 2023" 
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location" 
                  placeholder="San Francisco, CA" 
                  {...form.register("location")}
                />
                {form.formState.errors.location && (
                  <p className="text-sm text-red-500">{form.formState.errors.location.message}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input 
                    id="startDate" 
                    type="date" 
                    {...form.register("startDate")}
                  />
                  {form.formState.errors.startDate && (
                    <p className="text-sm text-red-500">{form.formState.errors.startDate.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input 
                    id="endDate" 
                    type="date" 
                    {...form.register("endDate")}
                  />
                  {form.formState.errors.endDate && (
                    <p className="text-sm text-red-500">{form.formState.errors.endDate.message}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select 
                  id="status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...form.register("status")}
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
                {form.formState.errors.status && (
                  <p className="text-sm text-red-500">{form.formState.errors.status.message}</p>
                )}
              </div>
            </div>
            
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createEventMutation.isPending}
              >
                {createEventMutation.isPending ? "Creating..." : "Create Event"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <MobileNav />
    </div>
  );
}
