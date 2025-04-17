import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { EventAttendee } from "@shared/schema";
import { Plus, Edit, Trash2, UserMinus, UserCheck } from "lucide-react";
import { AttendeeForm } from "./attendee-form";

interface AttendeeListProps {
  eventId: number;
}

export function AttendeeList({ eventId }: AttendeeListProps) {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAttendee, setEditingAttendee] = useState<EventAttendee | null>(null);
  const [selectedAttendee, setSelectedAttendee] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: attendees, isLoading, isError } = useQuery<EventAttendee[]>({
    queryKey: ["/api/events", eventId, "attendees"],
    queryFn: () => apiRequest("GET", `/api/events/${eventId}/attendees`).then(res => res.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: async (attendeeId: number) => {
      await apiRequest("DELETE", `/api/attendees/${attendeeId}`);
    },
    onSuccess: () => {
      toast({
        title: "Attendee removed",
        description: "The attendee has been removed from this event.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "attendees"] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove attendee",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return apiRequest("PUT", `/api/attendees/${id}`, { isActive }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "attendees"] });
      toast({
        title: "Status updated",
        description: "The attendee's status has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (attendeeId: number) => {
    setSelectedAttendee(attendeeId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedAttendee) {
      deleteMutation.mutate(selectedAttendee);
    }
  };

  const handleEdit = (attendee: EventAttendee) => {
    setEditingAttendee(attendee);
    setIsFormOpen(true);
  };

  const toggleActive = (attendee: EventAttendee) => {
    toggleActiveMutation.mutate({
      id: attendee.id,
      isActive: !attendee.isActive,
    });
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingAttendee(null);
  };

  const renderAttendeeList = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <p>Failed to load attendees. Please try again.</p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "attendees"] })}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (!attendees || attendees.length === 0) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <p>No team members assigned to this event yet.</p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => setIsFormOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {attendees.map((attendee) => (
          <Card key={attendee.id} className={attendee.isActive ? "" : "opacity-70"}>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="mr-4">
                  <Avatar>
                    <AvatarFallback>
                      {attendee.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1">
                  <div className="font-medium flex items-center">
                    {attendee.name}
                    {!attendee.isActive && (
                      <Badge variant="outline" className="ml-2 text-xs">Inactive</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {attendee.role || "No role specified"}
                  </div>
                  {attendee.email && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {attendee.email}
                    </div>
                  )}
                </div>
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => toggleActive(attendee)}
                    title={attendee.isActive ? "Mark as inactive" : "Mark as active"}
                  >
                    {attendee.isActive ? (
                      <UserMinus className="h-4 w-4" />
                    ) : (
                      <UserCheck className="h-4 w-4" />
                    )}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleEdit(attendee)}
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDelete(attendee.id)}
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {attendee.notes && (
                <div className="mt-2 text-sm text-muted-foreground border-t pt-2">
                  {attendee.notes}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Team Members</h2>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAttendee ? "Edit Team Member" : "Add Team Member"}
              </DialogTitle>
            </DialogHeader>
            <AttendeeForm 
              eventId={eventId} 
              attendee={editingAttendee} 
              onClose={handleFormClose} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {renderAttendeeList()}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this team member from the event? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}