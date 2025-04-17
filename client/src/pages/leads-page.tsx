import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { MobileHeader } from "@/components/mobile-header";
import { MobileNav } from "@/components/mobile-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { useState } from "react";
import { Lead } from "@shared/schema";
import { Search, Users, ChevronRight } from "lucide-react";

export default function LeadsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch leads
  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });
  
  // Filter leads by search query
  const filteredLeads = leads?.filter((lead) => {
    const fullName = `${lead.firstName} ${lead.lastName}`.toLowerCase();
    const company = (lead.company || "").toLowerCase();
    const email = lead.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return fullName.includes(query) || company.includes(query) || email.includes(query);
  });
  
  // Score badge color mapping
  const scoreColors = {
    high: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-gray-100 text-gray-800",
  };
  
  return (
    <div className="flex flex-col h-screen">
      <MobileHeader title="Leads" />
      
      <main className="flex-1 pb-16 md:pb-0 overflow-y-auto">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <h1 className="text-2xl font-semibold text-gray-900">All Leads</h1>
              
              <div className="mt-4 md:mt-0 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {isLoading ? (
              <div className="mt-6 space-y-4">
                {Array(5).fill(0).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="ml-4 space-y-1">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                        <Skeleton className="h-4 w-4 rounded-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredLeads?.length === 0 ? (
              <Card className="mt-6">
                <CardContent className="p-6 text-center">
                  {leads?.length === 0 ? (
                    <>
                      <Users className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No leads yet</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Start collecting leads at your events.
                      </p>
                    </>
                  ) : (
                    <>
                      <Search className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Try adjusting your search query.
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="mt-6 space-y-4">
                {filteredLeads?.map((lead) => (
                  <Link key={lead.id} href={`/leads/${lead.id}`}>
                    <Card className="cursor-pointer hover:border-primary-200 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Avatar>
                              <AvatarImage src={lead.avatar || undefined} />
                              <AvatarFallback>
                                {`${lead.firstName.charAt(0)}${lead.lastName.charAt(0)}`}
                              </AvatarFallback>
                            </Avatar>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-900">{`${lead.firstName} ${lead.lastName}`}</p>
                              <p className="text-xs text-gray-500">{lead.company || lead.title || lead.email}</p>
                              <div className="mt-1">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${scoreColors[lead.score as keyof typeof scoreColors]}`}>
                                  {lead.score.charAt(0).toUpperCase() + lead.score.slice(1)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}
