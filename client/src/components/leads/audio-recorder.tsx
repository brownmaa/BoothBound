import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Pause, Trash2, Upload, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  disabled?: boolean;
}

export function AudioRecorder({ onTranscriptionComplete, disabled = false }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Handle recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  // Clean up audioURL on unmount
  useEffect(() => {
    return () => {
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [audioURL]);

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        
        setRecordingBlob(audioBlob);
        setAudioURL(url);
        setRecordingDuration(elapsedTime);
        
        // Clean up stream tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setElapsedTime(0);
      
      // Clear any existing recording
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
        setAudioURL(null);
        setRecordingBlob(null);
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Recording Error',
        description: 'Permission denied or microphone not available.',
        variant: 'destructive'
      });
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Toggle play/pause
  const togglePlayback = () => {
    if (!audioRef.current || !audioURL) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };

  // Handle audio element events
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  // Delete recording
  const deleteRecording = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    
    setAudioURL(null);
    setRecordingBlob(null);
    setRecordingDuration(0);
    setElapsedTime(0);
  };

  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Transcribe recording
  const transcribeRecording = async () => {
    if (!recordingBlob) return;
    
    setIsTranscribing(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', recordingBlob, 'recording.wav');
      
      const res = await apiRequest('POST', '/api/transcribe', formData);
      
      const data = await res.json();
      
      if (data.text) {
        onTranscriptionComplete(data.text);
        toast({
          title: 'Transcription Complete',
          description: 'Your recording has been transcribed successfully.',
        });
      } else {
        throw new Error(data.error || 'Failed to transcribe audio');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: 'Transcription Failed',
        description: error instanceof Error ? error.message : 'Failed to transcribe audio. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden audio element for playback */}
      <audio 
        ref={audioRef} 
        src={audioURL || undefined} 
        onEnded={handleAudioEnded}
        className="hidden"
      />
      
      {/* Recording status and timer */}
      <div className="text-center">
        {isRecording ? (
          <div className="flex items-center justify-center text-red-500">
            <div className="animate-pulse mr-2 h-3 w-3 rounded-full bg-red-500"></div>
            <span className="text-sm font-medium">Recording... {formatTime(elapsedTime)}</span>
          </div>
        ) : audioURL ? (
          <div className="text-sm font-medium text-gray-700">
            Recording ({formatTime(recordingDuration)})
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Press the microphone button to start recording
          </p>
        )}
      </div>
      
      {/* Recorder Controls */}
      <div className="flex justify-center gap-3">
        {isRecording ? (
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={stopRecording}
            disabled={disabled}
          >
            <Square className="h-4 w-4 mr-1" />
            Stop
          </Button>
        ) : (
          <Button 
            variant="default" 
            size="sm" 
            onClick={startRecording}
            disabled={disabled}
          >
            <Mic className="h-4 w-4 mr-1" />
            Record
          </Button>
        )}
        
        {audioURL && !isRecording && (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={togglePlayback}
              disabled={disabled}
            >
              {isPlaying ? (
                <><Pause className="h-4 w-4 mr-1" /> Pause</>
              ) : (
                <><Play className="h-4 w-4 mr-1" /> Play</>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={deleteRecording}
              disabled={disabled || isTranscribing}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>

            <Button 
              variant="default" 
              size="sm" 
              onClick={transcribeRecording}
              disabled={disabled || isTranscribing}
            >
              {isTranscribing ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Processing...</>
              ) : (
                <><Upload className="h-4 w-4 mr-1" /> Transcribe</>
              )}
            </Button>
          </>
        )}
      </div>

      {/* Instructions */}
      {!audioURL && !isRecording && (
        <div className="text-xs text-gray-500 mt-4">
          <p>Record your notes by voice, then click "Transcribe" to convert to text.</p>
          <p className="mt-1">Your audio will be transcribed and added to your notes.</p>
        </div>
      )}
    </div>
  );
}