import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { MobileHeader } from "@/components/mobile-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, QrCode, X, Camera, Upload, ClipboardList } from "lucide-react";
import { enrichLeadWithClearbit } from "@/services/clearbit";
import { enrichLeadWithPhantomBuster } from "@/services/phantombuster";
import { InsertLead } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Create lead form schema
const leadFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  title: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
  score: z.enum(["low", "medium", "high"]).default("medium"),
  source: z.enum(["manual", "scan", "import"]).default("manual"),
  employeeId: z.number().optional(),
  employeeName: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

export default function ScannerPage() {
  const { eventId } = useParams();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("manual");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Form setup
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      title: "",
      company: "",
      notes: "",
      score: "medium",
      source: "manual",
      employeeName: user?.name || "",
    },
  });

  // Mutation for creating a lead
  const createLeadMutation = useMutation({
    mutationFn: async (data: InsertLead) => {
      const res = await apiRequest("POST", `/api/events/${eventId}/leads`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Lead captured!",
        description: "The lead has been successfully added.",
      });
      form.reset();
      setShowManualForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/events", parseInt(eventId || "0"), "leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", parseInt(eventId || "0")] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to capture lead",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Start camera
  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setIsScanning(true);
        }
      } else {
        toast({
          title: "Camera access error",
          description: "Your device doesn't support camera access or permission was denied.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Camera access error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
      console.error("Error accessing camera:", error);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
    setIsScanning(false);
  };

  // Clean up camera when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Handle scan result
  const handleScan = async (scanData: string) => {
    if (scanData) {
      stopCamera();
      setScanResult(scanData);
      
      // Parse scan data (assuming it's formatted as a vCard or similar)
      try {
        // Mock parsing of scan data for demonstration
        const parsedData = {
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          company: "Acme Inc.",
          title: "Product Manager"
        };
        
        // Set form values
        form.setValue("firstName", parsedData.firstName);
        form.setValue("lastName", parsedData.lastName);
        form.setValue("email", parsedData.email);
        form.setValue("company", parsedData.company);
        form.setValue("title", parsedData.title);
        form.setValue("source", "scan");
        
        // Enrich lead data
        await enrichLead(parsedData.email);
        
        setShowManualForm(true);
      } catch (error) {
        toast({
          title: "Scan error",
          description: "Could not parse scan data. Please enter details manually.",
          variant: "destructive",
        });
        
        // Still show the form for manual entry
        form.setValue("source", "scan");
        setShowManualForm(true);
      }
    }
  };

  // Simulate a scan for demonstration purposes
  const simulateScan = () => {
    setTimeout(() => {
      handleScan("BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nEMAIL:john.doe@example.com\nORG:Acme Inc.\nTITLE:Product Manager\nEND:VCARD");
    }, 2000);
  };

  // Enrich lead data using Clearbit and PhantomBuster
  const enrichLead = async (email: string) => {
    setIsEnriching(true);
    try {
      // Try Clearbit first
      let enrichmentData = await enrichLeadWithClearbit(email);
      
      // Fall back to PhantomBuster if needed
      if (!enrichmentData || !enrichmentData.avatar) {
        const phantomData = await enrichLeadWithPhantomBuster(email);
        if (phantomData) {
          enrichmentData = { ...enrichmentData, ...phantomData };
        }
      }
      
      // Update form with enriched data
      if (enrichmentData) {
        if (enrichmentData.firstName) form.setValue("firstName", enrichmentData.firstName);
        if (enrichmentData.lastName) form.setValue("lastName", enrichmentData.lastName);
        if (enrichmentData.title) form.setValue("title", enrichmentData.title);
        if (enrichmentData.company) form.setValue("company", enrichmentData.company);
        // Avatar would be passed to the API in the final submission
      }
      
      toast({
        title: "Lead enriched",
        description: "Lead information has been automatically enhanced.",
      });
    } catch (error) {
      console.error("Lead enrichment error:", error);
      toast({
        title: "Enrichment notice",
        description: "Could not automatically enhance lead data.",
      });
    } finally {
      setIsEnriching(false);
    }
  };

  // Form submission handler
  const onSubmit = (data: LeadFormValues) => {
    if (!user) return;
    
    createLeadMutation.mutate({
      ...data,
      eventId: parseInt(eventId || "0"),
      userId: user.id,
    });
  };

  return (
    <div className="flex flex-col h-screen">
      <MobileHeader title="Lead Scanner" />
      
      <main className="flex-1 overflow-y-auto pb-4">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Scan Lead</h1>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => navigate(`/events/${eventId}`)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="qr">QR Code</TabsTrigger>
                <TabsTrigger value="badge">Badge</TabsTrigger>
                <TabsTrigger value="manual">Manual</TabsTrigger>
              </TabsList>
              
              <TabsContent value="qr" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    {isScanning ? (
                      <div className="space-y-4">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                          <video 
                            ref={videoRef} 
                            className="absolute inset-0 w-full h-full object-cover"
                            autoPlay 
                            playsInline
                            onClick={() => simulateScan()} // For demo purposes
                          />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="border-2 border-primary w-2/3 h-2/3 rounded-lg"></div>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={stopCamera}
                        >
                          Cancel Scan
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center space-y-4">
                        <div className="bg-gray-100 rounded-lg p-12 flex flex-col items-center justify-center">
                          <QrCode className="h-16 w-16 text-gray-400 mb-4" />
                          <p className="text-sm text-gray-500">Point your camera at a QR code to scan</p>
                        </div>
                        <Button 
                          className="w-full"
                          onClick={startCamera}
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Enable Camera
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="badge" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    {isScanning ? (
                      <div className="space-y-4">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                          <video 
                            ref={videoRef} 
                            className="absolute inset-0 w-full h-full object-cover"
                            autoPlay 
                            playsInline
                            onClick={() => simulateScan()} // For demo purposes
                          />
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={stopCamera}
                        >
                          Cancel Scan
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center space-y-4">
                        <div className="bg-gray-100 rounded-lg p-12 flex flex-col items-center justify-center">
                          <Camera className="h-16 w-16 text-gray-400 mb-4" />
                          <p className="text-sm text-gray-500">Scan a conference badge or business card</p>
                        </div>
                        <Button 
                          className="w-full"
                          onClick={startCamera}
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Enable Camera
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="manual" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            placeholder="Jane"
                            {...form.register("firstName")}
                          />
                          {form.formState.errors.firstName && (
                            <p className="text-sm text-red-500">
                              {form.formState.errors.firstName.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            placeholder="Smith"
                            {...form.register("lastName")}
                          />
                          {form.formState.errors.lastName && (
                            <p className="text-sm text-red-500">
                              {form.formState.errors.lastName.message}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="jane.smith@example.com"
                          {...form.register("email")}
                        />
                        {form.formState.errors.email && (
                          <p className="text-sm text-red-500">
                            {form.formState.errors.email.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="company">Company</Label>
                          <Input
                            id="company"
                            placeholder="Acme Inc."
                            {...form.register("company")}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="title">Job Title</Label>
                          <Input
                            id="title"
                            placeholder="Product Manager"
                            {...form.register("title")}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          placeholder="+1 (555) 123-4567"
                          {...form.register("phone")}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="employeeName">Employee Name</Label>
                        <Input
                          id="employeeName"
                          placeholder="Who collected this lead"
                          {...form.register("employeeName")}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          placeholder="Interested in enterprise plan..."
                          {...form.register("notes")}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="score">Lead Quality</Label>
                        <select 
                          id="score"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...form.register("score")}
                        >
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <Button 
                          onClick={form.handleSubmit(onSubmit)}
                          disabled={createLeadMutation.isPending}
                        >
                          {createLeadMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Save Lead
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => form.reset()}
                          type="button"
                        >
                          Clear Form
                        </Button>
                        
                        <Button
                          variant="secondary"
                          className="mt-2"
                          onClick={() => enrichLead(form.getValues("email"))}
                          type="button"
                          disabled={!form.getValues("email") || isEnriching}
                        >
                          {isEnriching ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="mr-2 h-4 w-4" />
                          )}
                          {isEnriching ? "Enriching..." : "Enrich Lead Data"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      
      {/* Manual Entry Dialog */}
      <Dialog open={showManualForm} onOpenChange={setShowManualForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Lead Information</DialogTitle>
            <DialogDescription>
              Verify or edit the captured lead information.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dialog-firstName">First Name</Label>
                <Input
                  id="dialog-firstName"
                  value={form.getValues("firstName")}
                  onChange={(e) => form.setValue("firstName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dialog-lastName">Last Name</Label>
                <Input
                  id="dialog-lastName"
                  value={form.getValues("lastName")}
                  onChange={(e) => form.setValue("lastName", e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dialog-email">Email</Label>
              <Input
                id="dialog-email"
                type="email"
                value={form.getValues("email")}
                onChange={(e) => form.setValue("email", e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dialog-company">Company</Label>
                <Input
                  id="dialog-company"
                  value={form.getValues("company") || ""}
                  onChange={(e) => form.setValue("company", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dialog-title">Job Title</Label>
                <Input
                  id="dialog-title"
                  value={form.getValues("title") || ""}
                  onChange={(e) => form.setValue("title", e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dialog-employeeName">Employee Name</Label>
              <Input
                id="dialog-employeeName"
                placeholder="Who collected this lead"
                value={form.getValues("employeeName") || ""}
                onChange={(e) => form.setValue("employeeName", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dialog-notes">Notes</Label>
              <Textarea
                id="dialog-notes"
                placeholder="Add any additional notes..."
                value={form.getValues("notes") || ""}
                onChange={(e) => form.setValue("notes", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dialog-score">Lead Quality</Label>
              <select 
                id="dialog-score"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={form.getValues("score")}
                onChange={(e) => form.setValue("score", e.target.value as "high" | "medium" | "low")}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowManualForm(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={form.handleSubmit(onSubmit)}
              disabled={createLeadMutation.isPending}
            >
              {createLeadMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
