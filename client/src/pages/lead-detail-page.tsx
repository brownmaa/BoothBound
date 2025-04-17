import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { MobileHeader } from "@/components/mobile-header";
import { MobileNav } from "@/components/mobile-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
  Mail,
  Phone,
  Building,
  Briefcase,
  Tag,
  Pencil, 
  Trash2, 
  User,
  FileText,
  Link as LinkIcon,
  Award,
} from "lucide-react";
import { Lead } from "@shared/schema";

const scoreColors = {
  high: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-red-100 text-red-800",
};

const sourceIcons = {
  manual: User,
  scan: LinkIcon,
  import: FileText,
};

export default function LeadDetailPage() {
  const { id } = useParams();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  const leadId = parseInt(id || "0");
  
  // Fetch lead details
  const { 
    data: lead, 
    isLoading: leadLoading,
    error: leadError
  } = useQuery<Lead>({
    queryKey: ["/api/leads", leadId],
    enabled: !!leadId,
  });

  // Delete lead mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/leads/${leadId}`);
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Lead deleted",
        description: "The lead has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      navigate("/leads");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to delete the lead. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle delete lead
  const handleDeleteLead = () => {
    deleteMutation.mutate();
  };

  // If still loading
  if (leadLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader title="Lead Details" />
        <main className="container mx-auto px-4 pt-4 pb-16">
          <div className="max-w-3xl mx-auto">
            <div className="mt-4 animate-pulse">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-40 w-full mb-4" />
              <Skeleton className="h-60 w-full" />
            </div>
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  // If error or lead not found
  if (leadError || !lead) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader title="Error" />
        <main className="container mx-auto px-4 pt-4 pb-16">
          <div className="max-w-3xl mx-auto">
            <Card className="mt-4">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h2 className="text-lg font-medium">Lead Not Found</h2>
                  <p className="mt-2 text-gray-500">
                    The lead you're looking for doesn't exist or you don't have permission to view it.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => navigate("/leads")}
                  >
                    Back to Leads
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  // Format date
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "Unknown date";
    try {
      // Make sure we have a valid date object or string
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return format(date, "MMM d, yyyy 'at' h:mm a");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  // Get icon for source
  const SourceIcon = sourceIcons[lead.source as keyof typeof sourceIcons] || User;

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader title="Lead Details" />
      <main className="container mx-auto px-4 pt-4 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <Button 
                variant="outline" 
                className="mb-4"
                onClick={() => navigate("/leads")}
              >
                Back to Leads
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/leads/edit/${lead.id}`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700"
                onClick={() => setConfirmDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>

          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={lead.avatar || undefined} />
                    <AvatarFallback className="text-lg">
                      {`${lead.firstName ? lead.firstName.charAt(0) : ''}${lead.lastName ? lead.lastName.charAt(0) : ''}`}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-4">
                    <h2 className="text-xl font-semibold">{`${lead.firstName || 'Unknown'} ${lead.lastName || ''}`}</h2>
                    <div className="text-gray-600 flex items-center">
                      <SourceIcon className="mr-1 h-4 w-4" />
                      <span className="capitalize mr-2">{lead.source || 'Unknown'}</span>
                      {lead.score && (
                        <>
                          <span className="text-gray-400 mx-1">•</span>
                          <Badge className={scoreColors[lead.score as keyof typeof scoreColors]}>
                            {lead.score.charAt(0).toUpperCase() + lead.score.slice(1)}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{lead.email}</span>
                  </div>
                  {lead.phone && (
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{lead.phone}</span>
                    </div>
                  )}
                  {lead.title && (
                    <div className="flex items-center">
                      <Briefcase className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{lead.title}</span>
                    </div>
                  )}
                  {lead.company && (
                    <div className="flex items-center">
                      <Building className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{lead.company}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {lead.employeeName && (
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        Collected by: {lead.employeeName}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {formatDate(lead.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Tag className="h-5 w-5 text-gray-400 mr-2" />
                    <Button 
                      variant="ghost" 
                      className="p-0 h-auto text-sm text-primary-600 hover:text-primary-900"
                      onClick={() => navigate(`/events/${lead.eventId}`)}
                    >
                      View Event
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-200 pt-4">
                <h3 className="text-base font-medium mb-2">Notes</h3>
                <div className="p-3 bg-gray-50 rounded-md">
                  {lead.notes ? (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No notes available</p>
                  )}
                </div>
              </div>
              
              <div className="mt-6 border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-medium">AI Lead Score</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      // Trigger AI rescoring
                      fetch(`/api/leads/${lead.id}/score`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                      })
                      .then(res => {
                        if (!res.ok) throw new Error('Failed to score lead');
                        return res.json();
                      })
                      .then(data => {
                        toast({
                          title: "Lead scored successfully",
                          description: `Lead quality: ${data.scoring.score.toUpperCase()}`,
                        });
                        // Refresh the lead data
                        queryClient.invalidateQueries({ queryKey: ["/api/leads", leadId] });
                      })
                      .catch(err => {
                        toast({
                          title: "Error scoring lead",
                          description: err.message,
                          variant: "destructive",
                        });
                      });
                    }}
                  >
                    <Award className="mr-2 h-4 w-4" />
                    Re-Score
                  </Button>
                </div>
                <div className="p-4 bg-gray-50 rounded-md">
                  <div className="flex items-center mb-3">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      lead.score === 'high' ? 'bg-green-500' : 
                      lead.score === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="font-medium capitalize">{lead.score || 'Unknown'} Quality Lead</span>
                    {lead.aiSimilarityScore && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({Math.round(parseFloat(lead.aiSimilarityScore) * 100)}% match)
                      </span>
                    )}
                  </div>
                  {lead.aiScoreExplanation ? (
                    <p className="text-sm text-gray-700">{lead.aiScoreExplanation}</p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No AI scoring explanation available. Click "Re-Score" to generate an explanation.
                    </p>
                  )}
                </div>
              </div>
              
              <div className="mt-6 border-t border-gray-200 pt-4">
                <h3 className="text-base font-medium mb-2">Activity Timeline</h3>
                <div className="border-l-2 border-gray-200 pl-4 ml-2 space-y-4">
                  <div className="relative">
                    <div className="absolute -left-[29px] top-1 w-4 h-4 rounded-full bg-primary-600"></div>
                    <div>
                      <p className="text-sm font-medium">Lead Created</p>
                      <p className="text-xs text-gray-500">{formatDate(lead.createdAt)}</p>
                    </div>
                  </div>
                  {/* More timeline items would go here when we have lead activities */}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Confirm Delete Dialog */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the lead and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteLead}
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