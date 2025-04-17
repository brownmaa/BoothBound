import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MobileHeader } from "@/components/mobile-header";
import { MobileNav } from "@/components/mobile-nav";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, PieChart, User } from "lucide-react";
import { Event, Lead } from "@shared/schema";
import { LeadsByEventChart, QualityDistributionChart, LeadsByEmployeeChart } from "@/components/analytics/charts";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch events
  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });
  
  // Fetch leads
  const { data: leads, isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });
  
  // Calculate high-level stats
  const totalLeads = leads?.length || 0;
  const totalEvents = events?.length || 0;
  const activeEvents = events?.filter(event => event.status === "active").length || 0;
  
  // Calculate score distribution
  const highScoreLeads = leads?.filter(lead => lead.score === "high").length || 0;
  const mediumScoreLeads = leads?.filter(lead => lead.score === "medium").length || 0;
  const lowScoreLeads = leads?.filter(lead => lead.score === "low").length || 0;
  
  // Calculate conversion rate (mock fixed value as it would require more complex calculation)
  const conversionRate = "24%";
  
  const isLoading = eventsLoading || leadsLoading;

  return (
    <div className="flex flex-col h-screen">
      <MobileHeader title="Analytics" />
      
      <main className="flex-1 pb-16 md:pb-0 overflow-y-auto">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
              
              <Select defaultValue={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Select Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="day">Last 24 Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Quick Stats Cards */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Leads</p>
                      {isLoading ? (
                        <Skeleton className="h-8 w-16 mt-1" />
                      ) : (
                        <p className="text-3xl font-bold text-gray-900">{totalLeads}</p>
                      )}
                    </div>
                    <div className="rounded-full p-2 bg-primary-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Events</p>
                      {isLoading ? (
                        <Skeleton className="h-8 w-16 mt-1" />
                      ) : (
                        <p className="text-3xl font-bold text-gray-900">{totalEvents}</p>
                      )}
                      {!isLoading && (
                        <p className="text-sm text-gray-500 mt-1">{activeEvents} active</p>
                      )}
                    </div>
                    <div className="rounded-full p-2 bg-primary-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Quality Score</p>
                      {isLoading ? (
                        <Skeleton className="h-8 w-16 mt-1" />
                      ) : (
                        <p className="text-3xl font-bold text-gray-900">{highScoreLeads}</p>
                      )}
                      {!isLoading && (
                        <p className="text-sm text-gray-500 mt-1">High quality leads</p>
                      )}
                    </div>
                    <div className="rounded-full p-2 bg-green-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
                      <p className="text-3xl font-bold text-gray-900">{conversionRate}</p>
                    </div>
                    <div className="rounded-full p-2 bg-primary-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Charts */}
            <div className="mt-8">
              <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BarChart className="h-5 w-5 mr-2" />
                        Leads by Event
                      </CardTitle>
                      <CardDescription>
                        Distribution of leads across different events
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      {isLoading ? (
                        <div className="h-full flex items-center justify-center">
                          <Skeleton className="h-full w-full" />
                        </div>
                      ) : (
                        <LeadsByEventChart events={events || []} leads={leads || []} />
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <PieChart className="h-5 w-5 mr-2" />
                        Lead Quality Distribution
                      </CardTitle>
                      <CardDescription>
                        Breakdown of leads by quality score
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      {isLoading ? (
                        <div className="h-full flex items-center justify-center">
                          <Skeleton className="h-full w-full" />
                        </div>
                      ) : (
                        <QualityDistributionChart 
                          highCount={highScoreLeads} 
                          mediumCount={mediumScoreLeads} 
                          lowCount={lowScoreLeads} 
                        />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="performance" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <User className="h-5 w-5 mr-2" />
                        Leads by Employee
                      </CardTitle>
                      <CardDescription>
                        Track which team members are collecting the most leads
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      {isLoading ? (
                        <div className="h-full flex items-center justify-center">
                          <Skeleton className="h-full w-full" />
                        </div>
                      ) : (
                        <LeadsByEmployeeChart leads={leads || []} />
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Event Performance</CardTitle>
                      <CardDescription>
                        Compare lead acquisition performance across events
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-72 flex items-center justify-center bg-gray-50 rounded-md">
                        <div className="text-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <p className="mt-2 text-sm text-gray-500">Detailed performance metrics</p>
                          <p className="mt-1 text-xs text-gray-400">Coming soon</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}
