import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  disabled?: boolean;
}

export function AudioRecorder({ onTranscriptionComplete, disabled = false }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [isRecording, audioURL]);

  const startRecording = async () => {
    audioChunksRef.current = [];
    setAudioURL(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Microphone Access Error",
        description: "Please allow microphone access to record audio notes.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all audio tracks to turn off the microphone
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const transcribeAudio = async () => {
    if (!audioURL) return;
    
    setIsTranscribing(true);
    
    try {
      const audioBlob = await fetch(audioURL).then(r => r.blob());
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      
      // Call transcription API
      const response = await apiRequest('POST', '/api/transcribe', formData);
      const data = await response.json();
      
      if (data.text) {
        onTranscriptionComplete(data.text);
        toast({
          title: "Transcription Complete",
          description: "Your audio has been converted to text.",
        });
      } else {
        throw new Error("No transcription returned");
      }
    } catch (error) {
      console.error("Transcription error:", error);
      toast({
        title: "Transcription Failed",
        description: "Unable to convert your audio to text. Please try again or type your notes.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const playRecording = () => {
    if (audioURL) {
      const audio = new Audio(audioURL);
      audio.play();
    }
  };

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center space-x-2">
        {!isRecording && !audioURL && (
          <Button 
            type="button" 
            variant="outline"
            onClick={startRecording}
            disabled={disabled}
            className="w-full"
          >
            <Mic className="h-4 w-4 mr-2" />
            Record Audio Note
          </Button>
        )}
        
        {isRecording && (
          <Button 
            type="button" 
            variant="outline"
            onClick={stopRecording}
            className="w-full bg-red-50 text-red-600 border-red-200"
          >
            <Square className="h-4 w-4 mr-2" />
            Stop Recording
          </Button>
        )}
        
        {audioURL && (
          <>
            <Button 
              type="button" 
              variant="outline"
              onClick={playRecording}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              Play
            </Button>
            
            <Button 
              type="button" 
              variant="outline"
              onClick={transcribeAudio}
              disabled={isTranscribing}
              className="flex-1"
            >
              {isTranscribing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Transcribing...
                </>
              ) : (
                "Transcribe"
              )}
            </Button>
            
            <Button 
              type="button" 
              variant="outline"
              onClick={startRecording}
              disabled={disabled}
              className="flex-1"
            >
              <Mic className="h-4 w-4 mr-2" />
              Record New
            </Button>
          </>
        )}
      </div>
      
      {audioURL && (
        <div className="text-xs text-gray-500">
          {isTranscribing 
            ? "Converting your audio to text..." 
            : "Audio recorded. Click Play to listen, Transcribe to convert to text, or Record New to start over."}
        </div>
      )}
    </div>
  );
}