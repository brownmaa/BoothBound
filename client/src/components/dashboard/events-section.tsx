import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { PlusIcon, User } from "lucide-react";
import { Event } from "@shared/schema";

export function EventsSection() {
  // Fetch events
  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });
  
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
  
  // Event status badge color mapping
  const statusColors = {
    active: "bg-green-100 text-green-800",
    upcoming: "bg-yellow-100 text-yellow-800",
    completed: "bg-gray-100 text-gray-800",
  };
  
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Your Events</h2>
        <Link href="/events/new">
          <Button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-700">
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            New Event
          </Button>
        </Link>
      </div>
      
      {isLoading ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                  <div className="flex items-center">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="ml-3">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-12 mt-1" />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="px-4 py-4 bg-gray-50">
                <div className="flex justify-between w-full">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : events?.length === 0 ? (
        <div className="mt-4 bg-white shadow overflow-hidden rounded-lg p-6 text-center">
          <p className="text-gray-500">You don't have any events yet.</p>
          <Link href="/events/new">
            <Button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-700">
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Create Your First Event
            </Button>
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events?.map((event) => (
            <Card key={event.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">{event.name}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[event.status as keyof typeof statusColors]}`}>
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">{event.location}</p>
                  <p className="text-sm text-gray-500">
                    {formatDateRange(new Date(event.startDate), new Date(event.endDate))}
                  </p>
                </div>
                <div className="mt-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{event.leadCount} Leads</p>
                      <p className="text-xs text-gray-500">
                        {event.todayLeadCount > 0
                          ? `${event.todayLeadCount} Today`
                          : event.status === "upcoming"
                          ? `Starts ${format(new Date(event.startDate), "MMM d")}`
                          : "No new leads today"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="px-4 py-4 bg-gray-50">
                <div className="flex justify-between w-full">
                  <Link href={`/events/${event.id}`} className="text-sm font-medium text-primary hover:text-primary-600">
                    View Event
                  </Link>
                  {event.status === "active" ? (
                    <Link href={`/scanner/${event.id}`} className="text-sm font-medium text-primary hover:text-primary-600">
                      Scan Leads
                    </Link>
                  ) : (
                    <span className="text-sm font-medium text-gray-400 cursor-not-allowed">
                      Scan Leads
                    </span>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
