import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Lead } from "@shared/schema";

export function LeadsSection() {
  // Fetch leads
  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });
  
  // Get the most recent 5 leads
  const recentLeads = leads?.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5);
  
  // Score badge color mapping
  const scoreColors = {
    high: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-gray-100 text-gray-800",
  };
  
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Recent Leads</h2>
        <Link href="/leads" className="text-sm font-medium text-primary hover:text-primary-600">
          View all leads
        </Link>
      </div>
      
      <div className="mt-4 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
              <th scope="col" className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 sm:table-cell">Title</th>
              <th scope="col" className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell">Company</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Event</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Score</th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading ? (
              // Loading skeleton
              Array(5).fill(0).map((_, index) => (
                <tr key={index}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                    <div className="flex items-center">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="ml-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-40 mt-1" />
                      </div>
                    </div>
                  </td>
                  <td className="hidden whitespace-nowrap px-3 py-4 text-sm sm:table-cell">
                    <Skeleton className="h-4 w-28" />
                  </td>
                  <td className="hidden whitespace-nowrap px-3 py-4 text-sm lg:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <Skeleton className="h-4 w-12 ml-auto" />
                  </td>
                </tr>
              ))
            ) : recentLeads?.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-500">
                  No leads found. Start scanning leads at your next event!
                </td>
              </tr>
            ) : (
              recentLeads?.map((lead) => (
                <tr key={lead.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                    <div className="flex items-center">
                      <Avatar>
                        <AvatarImage src={lead.avatar || undefined} />
                        <AvatarFallback>
                          {`${lead.firstName.charAt(0)}${lead.lastName.charAt(0)}`}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">{`${lead.firstName} ${lead.lastName}`}</div>
                        <div className="text-gray-500">{lead.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden whitespace-nowrap px-3 py-4 text-sm text-gray-500 sm:table-cell">
                    {lead.title || "-"}
                  </td>
                  <td className="hidden whitespace-nowrap px-3 py-4 text-sm text-gray-500 lg:table-cell">
                    {lead.company || "-"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {/* This requires an additional query to get event name, but for simplicity we'll just show ID */}
                    Event #{lead.eventId}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${scoreColors[lead.score as keyof typeof scoreColors]}`}>
                      {lead.score.charAt(0).toUpperCase() + lead.score.slice(1)}
                    </span>
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <Link href={`/leads/${lead.id}`} className="text-primary hover:text-primary-900">
                      View<span className="sr-only">, {lead.firstName} {lead.lastName}</span>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
