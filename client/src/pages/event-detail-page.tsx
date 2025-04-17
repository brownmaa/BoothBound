import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "wouter";
import { MobileHeader } from "@/components/mobile-header";
import { MobileNav } from "@/components/mobile-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Pencil, 
  Trash2, 
  Plus, 
  Download,
  QrCode,
  Award
} from "lucide-react";
import { Event, Lead } from "@shared/schema";
import { CSVImport } from "@/components/leads/csv-import";
import { AttendeeList } from "@/components/events/attendee-list";

export default function EventDetailPage() {
  const { id } = useParams();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const eventId = parseInt(id || "0");

  // Fetch event details
  const { 
    data: event, 
    isLoading: eventLoading,
    error: eventError
  } = useQuery<Event>({
    queryKey: ["/api/events", eventId],
    enabled: !!eventId,
  });

  // Fetch event leads
  const {
    data: leads,
    isLoading: leadsLoading,
  } = useQuery<Lead[]>({
    queryKey: ["/api/events", eventId, "leads"],
    enabled: !!eventId,
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/events/${eventId}`);
    },
    onSuccess: () => {
      toast({
        title: "Event deleted",
        description: "The event has been deleted successfully.",
      });
      navigate("/events");
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete event",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle delete event
  const handleDeleteEvent = () => {
    deleteEventMutation.mutate();
  };

  // If event not found or error
  if (eventError) {
    return (
      <div className="flex flex-col h-screen">
        <MobileHeader title="Event Details" />
        <main className="flex-1 pb-16 md:pb-0 overflow-y-auto">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <h2 className="text-lg font-medium text-red-600">Error</h2>
                <p className="mt-1 text-gray-500">Failed to load event details. The event may not exist or you don't have access.</p>
                <Button 
                  onClick={() => navigate("/events")}
                  className="mt-4"
                >
                  Back to Events
                </Button>
              </div>
            </div>
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  // Format date range for display
  const formatDateRange = (startDate?: Date, endDate?: Date) => {
    if (!startDate || !endDate) return "";

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

  // Score badge color mapping
  const scoreColors = {
    high: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="flex flex-col h-screen">
      <MobileHeader title="Event Details" />

      <main className="flex-1 pb-16 md:pb-0 overflow-y-auto">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {eventLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-1/2" />
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <Skeleton className="h-6 w-1/4" />
                      <div className="flex space-x-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h1 className="text-2xl font-semibold text-gray-900">{event?.name}</h1>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setConfirmDeleteOpen(true)}
                      title="Delete Event"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => navigate(`/events/${eventId}/edit`)}
                      title="Edit Event"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Card className="mt-6">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${event?.status ? statusColors[event.status as keyof typeof statusColors] : statusColors.active}`}>
                            {event?.status ? `${event.status.charAt(0).toUpperCase()}${event.status.slice(1)}` : 'Active'}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5" />
                          <p>
                            {formatDateRange(
                              event?.startDate ? new Date(event.startDate) : undefined,
                              event?.endDate ? new Date(event.endDate) : undefined
                            )}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <MapPin className="flex-shrink-0 mr-1.5 h-5 w-5" />
                          <p>{event?.location}</p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <Users className="flex-shrink-0 mr-1.5 h-5 w-5" />
                          <p>{event?.leadCount} total leads collected</p>
                        </div>
                        {event?.todayLeadCount && event.todayLeadCount > 0 && (
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <Clock className="flex-shrink-0 mr-1.5 h-5 w-5" />
                            <p>{event.todayLeadCount} leads collected today</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {event?.status === "active" && (
                      <div className="mt-6">
                        <Button 
                          className="w-full sm:w-auto"
                          onClick={() => navigate(`/scanner/${eventId}`)}
                        >
                          <QrCode className="mr-2 h-4 w-4" />
                          Scan Leads
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="mt-6">
                  <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="w-full">
                      <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                      <TabsTrigger value="leads" className="flex-1">Leads ({leads?.length || 0})</TabsTrigger>
                      <TabsTrigger value="team" className="flex-1">Team</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Event Stats</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="text-sm font-medium text-gray-500">Total Leads</p>
                              <p className="text-2xl font-bold">{event?.leadCount || 0}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="text-sm font-medium text-gray-500">Today's Leads</p>
                              <p className="text-2xl font-bold">{event?.todayLeadCount || 0}</p>
                            </div>
                          </div>

                          <div className="mt-6">
                            <h3 className="text-lg font-medium">AI Lead Scoring Criteria</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Define what makes a lead valuable for this event. The AI will use this criteria to score all leads.
                            </p>
                            <div className="mt-3">
                              <textarea 
                                className="w-full min-h-[120px] p-3 border rounded-md text-sm"
                                placeholder="Example: A valuable lead is a decision-maker (Director level or above) from the financial industry who has expressed interest in our analytics products. They have budget authority and are looking to implement a solution in the next 6 months."
                                defaultValue={event?.leadScoringCriteria || ""}
                                onBlur={(e) => {
                                  const criteria = e.target.value.trim();
                                  if (criteria !== event?.leadScoringCriteria) {
                                    // Update the scoring criteria
                                    fetch(`/api/events/${eventId}/scoring-criteria`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ criteria })
                                    })
                                    .then(res => {
                                      if (!res.ok) throw new Error('Failed to update scoring criteria');
                                      return res.json();
                                    })
                                    .then(() => {
                                      toast({
                                        title: "Scoring criteria updated",
                                        description: "Lead scoring criteria has been updated successfully.",
                                      });
                                      // Refresh the event data
                                      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId] });
                                    })
                                    .catch(err => {
                                      toast({
                                        title: "Error updating criteria",
                                        description: err.message,
                                        variant: "destructive",
                                      });
                                    });
                                  }
                                }}
                              />
                              <div className="flex justify-end mt-2">
                                <Button 
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    // Trigger batch AI lead scoring
                                    fetch(`/api/events/${eventId}/leads/score`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' }
                                    })
                                    .then(res => {
                                      if (!res.ok) throw new Error('Failed to score leads');
                                      return res.json();
                                    })
                                    .then(data => {
                                      const { results } = data;
                                      toast({
                                        title: "Leads scored successfully",
                                        description: `Processed ${results.processed}/${results.total} leads (High: ${results.high}, Medium: ${results.medium}, Low: ${results.low})`,
                                      });
                                      // Refresh the leads data
                                      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "leads"] });
                                    })
                                    .catch(err => {
                                      toast({
                                        title: "Error scoring leads",
                                        description: err.message,
                                        variant: "destructive",
                                      });
                                    });
                                  }}
                                >
                                  <Award className="mr-2 h-4 w-4" />
                                  Re-score all leads with these criteria
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="mt-6">
                            <h3 className="text-lg font-medium">Actions</h3>
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <Button variant="outline" className="flex items-center">
                                <Download className="mr-2 h-4 w-4" />
                                Export Leads (CSV)
                              </Button>
                              {event?.status === "active" && (
                                <Button 
                                  onClick={() => navigate(`/scanner/${eventId}`)}
                                  className="flex items-center"
                                >
                                  <QrCode className="mr-2 h-4 w-4" />
                                  Scan Leads
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="leads" className="mt-4">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle>Collected Leads</CardTitle>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                // Trigger batch AI lead scoring
                                fetch(`/api/events/${eventId}/leads/score`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' }
                                })
                                .then(res => {
                                  if (!res.ok) throw new Error('Failed to score leads');
                                  return res.json();
                                })
                                .then(data => {
                                  const { results } = data;
                                  toast({
                                    title: "Leads scored successfully",
                                    description: `Processed ${results.processed}/${results.total} leads (High: ${results.high}, Medium: ${results.medium}, Low: ${results.low})`,
                                  });
                                  // Refresh the leads data
                                  queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "leads"] });
                                })
                                .catch(err => {
                                  toast({
                                    title: "Error scoring leads",
                                    description: err.message,
                                    variant: "destructive",
                                  });
                                });
                              }}
                            >
                              <Award className="mr-2 h-4 w-4" />
                              AI Score All
                            </Button>
                            <CSVImport eventId={eventId ? Number(eventId) : undefined} />
                            <Button 
                              onClick={() => navigate(`/scanner/${eventId}`)}
                              disabled={event?.status !== "active"}
                              className="flex items-center"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add Lead
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {leadsLoading ? (
                            <div className="space-y-4">
                              {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center space-x-4">
                                  <Skeleton className="h-12 w-12 rounded-full" />
                                  <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-24" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : leads?.length === 0 ? (
                            <div className="text-center py-6">
                              <Users className="mx-auto h-12 w-12 text-gray-400" />
                              <h3 className="mt-2 text-sm font-medium text-gray-900">No leads yet</h3>
                              <p className="mt-1 text-sm text-gray-500">
                                Start collecting leads at your event.
                              </p>
                              {event?.status === "active" && (
                                <div className="mt-6">
                                  <Button
                                    onClick={() => navigate(`/scanner/${eventId}`)}
                                  >
                                    <QrCode className="mr-2 h-4 w-4" />
                                    Scan Leads
                                  </Button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-200">
                              {leads?.map((lead) => (
                                <div 
                                  key={lead.id} 
                                  className="py-4 flex items-center justify-between"
                                >
                                  <div className="flex items-center">
                                    <Avatar>
                                      <AvatarImage src={lead.avatar || undefined} />
                                      <AvatarFallback>
                                        {`${lead?.firstName?.charAt(0) || ''}${lead?.lastName?.charAt(0) || ''}`}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="ml-3">
                                      <p className="text-sm font-medium text-gray-900">{`${lead.firstName || 'Unknown'} ${lead.lastName || ''}`}</p>
                                      <p className="text-sm text-gray-500">{lead.company || lead.title}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${lead.score ? scoreColors[lead.score as keyof typeof scoreColors] : scoreColors.medium}`}>
                                      {lead.score ? lead.score.charAt(0).toUpperCase() + lead.score.slice(1) : 'Medium'}
                                    </span>
                                    <button 
                                      className="ml-4 text-sm text-primary-600 hover:text-primary-900"
                                      onClick={() => navigate(`/leads/${lead.id}`)}
                                    >
                                      View
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="team" className="mt-4">
                      <Card>
                        <CardContent className="p-6">
                          <AttendeeList eventId={Number(eventId)} />
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Confirm Delete Dialog */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event and all associated leads.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteEvent}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MobileNav />
    </div>
  );
}