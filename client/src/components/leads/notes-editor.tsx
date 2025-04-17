import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AudioRecorder } from "./audio-recorder";
import { Save, X, Edit, FileText, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NotesEditorProps {
  initialNotes: string | null;
  leadId: number;
  onSave: (notes: string) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

export function NotesEditor({ initialNotes, leadId, onSave, onCancel, className = "" }: NotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes || "");
  const [isEditing, setIsEditing] = useState(!initialNotes);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(notes);
      setIsEditing(false);
      toast({
        title: "Notes saved",
        description: "Your notes have been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving notes:", error);
      toast({
        title: "Error saving notes",
        description: "There was a problem saving your notes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (!initialNotes) {
      // If there were no initial notes, reset to empty
      setNotes("");
    } else {
      // Otherwise revert to initial notes
      setNotes(initialNotes);
    }
    setIsEditing(false);
    onCancel();
  };

  const handleTranscription = (text: string) => {
    // Append the transcribed text to the existing notes
    setNotes(prevNotes => {
      if (prevNotes.trim()) {
        return `${prevNotes}\n\n${text}`;
      }
      return text;
    });
  };

  // If we're not in edit mode, just display the notes
  if (!isEditing) {
    return (
      <div className={`relative space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Notes
          </h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsEditing(true)}
            className="h-7 px-2"
          >
            <Edit className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
        </div>
        <div className="p-3 bg-slate-50 rounded-md text-sm text-slate-700 min-h-[100px]">
          {notes ? (
            notes.split("\n").map((line, i) => (
              <p key={i} className={line.trim() ? "" : "h-4"}>
                {line}
              </p>
            ))
          ) : (
            <p className="text-slate-400 italic">No notes available. Click Edit to add notes.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-1">
          <FileText className="h-4 w-4" />
          Edit Notes
        </h3>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCancel}
            className="h-7 px-2"
            disabled={isSaving}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Cancel
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleSave}
            className="h-7 px-2"
            disabled={isSaving}
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="type">
        <TabsList className="grid grid-cols-2 h-9">
          <TabsTrigger value="type" className="flex gap-1 items-center">
            <FileText className="h-3.5 w-3.5" />
            Type Notes
          </TabsTrigger>
          <TabsTrigger value="record" className="flex gap-1 items-center">
            <Mic className="h-3.5 w-3.5" />
            Voice Notes
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="type" className="mt-2">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter notes about this lead..."
            className="min-h-[200px] resize-none"
            disabled={isSaving}
          />
        </TabsContent>
        
        <TabsContent value="record" className="mt-2">
          <div className="bg-slate-50 p-3 rounded-md min-h-[200px]">
            <AudioRecorder 
              onTranscriptionComplete={handleTranscription} 
              disabled={isSaving}
            />
            
            {notes && (
              <div className="mt-4">
                <h4 className="text-xs font-medium mb-1">Current Notes:</h4>
                <div className="text-sm text-slate-700 p-2 bg-white rounded border">
                  {notes.split("\n").map((line, i) => (
                    <p key={i} className={line.trim() ? "" : "h-4"}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}