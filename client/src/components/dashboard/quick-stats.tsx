import { useQuery } from "@tanstack/react-query";
import { User, Calendar, PieChart } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Event } from "@shared/schema";

export function QuickStats() {
  // Fetch events
  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });
  
  // Calculate event stats
  const activeEvents = events?.filter(event => event.status === "active") || [];
  const totalLeads = events?.reduce((total, event) => total + event.leadCount, 0) || 0;
  
  // Calculate conversion rate - This would typically be more complex
  // For now we'll just use a mock value of 24%
  const conversionRate = "24%";
  
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Total Leads Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Leads</dt>
                <dd>
                  {eventsLoading ? (
                    <Skeleton className="h-7 w-12 mt-1" />
                  ) : (
                    <div className="text-lg font-medium text-gray-900">{totalLeads}</div>
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-4 py-4">
          <div className="text-sm">
            <Link href="/leads" className="font-medium text-primary hover:text-primary-600">
              View all<span className="sr-only"> total leads</span>
            </Link>
          </div>
        </CardFooter>
      </Card>
      
      {/* Active Events Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Active Events</dt>
                <dd>
                  {eventsLoading ? (
                    <Skeleton className="h-7 w-10 mt-1" />
                  ) : (
                    <div className="text-lg font-medium text-gray-900">{activeEvents.length}</div>
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-4 py-4">
          <div className="text-sm">
            <Link href="/events" className="font-medium text-primary hover:text-primary-600">
              View all<span className="sr-only"> active events</span>
            </Link>
          </div>
        </CardFooter>
      </Card>
      
      {/* Conversion Rate Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
              <PieChart className="h-6 w-6 text-primary" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Conversion Rate</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">{conversionRate}</div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-4 py-4">
          <div className="text-sm">
            <Link href="/analytics" className="font-medium text-primary hover:text-primary-600">
              View analytics<span className="sr-only"> conversion rate</span>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
