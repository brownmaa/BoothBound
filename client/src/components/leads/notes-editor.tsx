import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AudioRecorder } from './audio-recorder';

interface NotesEditorProps {
  initialNotes: string | null;
  leadId: number;
  onSave: (notes: string) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

export function NotesEditor({ initialNotes, leadId, onSave, onCancel, className = "" }: NotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes || '');
  const [activeTab, setActiveTab] = useState<string>('text');
  const [isSaving, setIsSaving] = useState(false);
  
  // Reset notes if initialNotes changes (parent component state reset)
  useEffect(() => {
    setNotes(initialNotes || '');
  }, [initialNotes]);
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(notes);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleTranscriptionComplete = (transcribedText: string) => {
    setNotes(prev => {
      const prefix = prev ? prev + '\n\n' : '';
      return prefix + transcribedText;
    });
    setActiveTab('text');
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-medium">Edit Notes</h3>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text">Type Notes</TabsTrigger>
          <TabsTrigger value="audio">Record Audio</TabsTrigger>
        </TabsList>
        
        <TabsContent value="text" className="mt-4">
          <Textarea 
            placeholder="Add notes about this lead here..."
            className="min-h-[200px] resize-y"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="text-xs text-gray-500 mt-2">
            Type your notes directly, or use the audio tab to record and transcribe notes.
          </div>
        </TabsContent>
        
        <TabsContent value="audio" className="mt-4">
          <AudioRecorder 
            onTranscriptionComplete={handleTranscriptionComplete} 
            disabled={isSaving}
          />
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end gap-2 pt-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Notes'}
        </Button>
      </div>
    </div>
  );
}