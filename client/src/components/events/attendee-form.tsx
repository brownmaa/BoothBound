import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EventAttendee, insertEventAttendeeSchema } from "@shared/schema";

// Extend the insert schema to add validation
const attendeeFormSchema = insertEventAttendeeSchema.extend({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }).optional().or(z.literal("")),
});

type AttendeeFormValues = z.infer<typeof attendeeFormSchema>;

interface AttendeeFormProps {
  eventId: number;
  attendee: EventAttendee | null;
  onClose: () => void;
}

export function AttendeeForm({ eventId, attendee, onClose }: AttendeeFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set up form with default values
  const form = useForm<AttendeeFormValues>({
    resolver: zodResolver(attendeeFormSchema),
    defaultValues: {
      eventId,
      name: attendee?.name || "",
      email: attendee?.email || "",
      role: attendee?.role || "",
      notes: attendee?.notes || "",
      isActive: attendee?.isActive ?? true,
    },
  });

  // Create or update attendee mutation
  const mutation = useMutation({
    mutationFn: async (data: AttendeeFormValues) => {
      if (attendee) {
        // Update existing attendee
        return apiRequest("PUT", `/api/attendees/${attendee.id}`, data).then(res => res.json());
      } else {
        // Create new attendee
        return apiRequest("POST", `/api/events/${eventId}/attendees`, data).then(res => res.json());
      }
    },
    onSuccess: () => {
      toast({
        title: attendee ? "Team member updated" : "Team member added",
        description: attendee 
          ? "The team member has been updated successfully." 
          : "The team member has been added to this event.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "attendees"] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Something went wrong",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Handle form submission
  const onSubmit = (data: AttendeeFormValues) => {
    setIsSubmitting(true);
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter email address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Sales Rep, Technical Demo" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional notes or instructions" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Active</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Indicates if this team member is currently active for the event
                </p>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {attendee ? "Update" : "Add"} Team Member
          </Button>
        </div>
      </form>
    </Form>
  );
}