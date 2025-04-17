import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AudioRecorder } from "@/components/leads/audio-recorder";
import { Save, FileText, Mic, Loader2 } from "lucide-react";
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
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(notes);
      toast({
        title: "Notes Saved",
        description: "Your notes have been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to Save Notes",
        description: error.message || "An error occurred while saving notes.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTranscriptionComplete = (text: string) => {
    // Append the transcribed text to existing notes
    if (notes) {
      setNotes(prev => prev + "\n\n" + text);
    } else {
      setNotes(text);
    }
  };

  return (
    <div className={`bg-white rounded-md p-4 ${className}`}>
      <Tabs defaultValue="text">
        <TabsList className="mb-4">
          <TabsTrigger value="text">
            <FileText className="h-4 w-4 mr-2" />
            Text Note
          </TabsTrigger>
          <TabsTrigger value="audio">
            <Mic className="h-4 w-4 mr-2" />
            Audio Note
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="text">
          <Textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter notes about this lead..."
            className="min-h-[150px] mb-4"
          />
        </TabsContent>
        
        <TabsContent value="audio">
          <AudioRecorder 
            onTranscriptionComplete={handleTranscriptionComplete}
            disabled={isSaving}
          />
          
          {notes && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Current Notes:</h4>
              <div className="p-3 bg-gray-50 rounded-md text-sm whitespace-pre-wrap">
                {notes}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end space-x-2 mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Notes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}