import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Lead } from "@shared/schema";

interface CSVImportProps {
  eventId?: number;
}

export function CSVImport({ eventId }: CSVImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      setFile(null);
      setPreview([]);
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        // Simple CSV parsing
        const lines = text.split("\n");
        const result = lines.map(line => line.split(",").map(value => value.trim()));
        setPreview(result.slice(0, 5)); // Show first 5 rows as preview
      }
    };
    reader.readAsText(selectedFile);
  };

  const importMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const endpoint = eventId 
        ? `/api/events/${eventId}/leads/import` 
        : `/api/leads/import`;
      // Use form data upload
      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      return await res.json();
    },
    onSuccess: (data: { imported: number }) => {
      setIsOpen(false);
      setFile(null);
      setPreview([]);
      toast({
        title: "Import successful",
        description: `Successfully imported ${data.imported} leads.`,
      });
      // Invalidate queries to refresh lead data
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "leads"] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Import failed",
        description: error.message || "There was an error importing your leads.",
        variant: "destructive",
      });
    },
  });

  const handleImport = () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    if (eventId) {
      formData.append("eventId", eventId.toString());
    }

    importMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload size={16} />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Leads from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple leads at once. The file should include columns for 
            firstName, lastName, email, company, title, phone, and notes.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Label htmlFor="csv-file">Select CSV File</Label>
          <Input 
            id="csv-file" 
            type="file" 
            accept=".csv" 
            onChange={handleFileChange}
            className="cursor-pointer"
          />
          
          {preview.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Preview (first 5 rows):</h4>
              <div className="border rounded-md p-3 overflow-x-auto">
                <table className="min-w-full">
                  <tbody>
                    {preview.map((row, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex === 0 ? "font-medium bg-muted" : ""}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-2 py-1 border-b text-sm">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          <div className="text-sm text-muted-foreground mt-2">
            <h4 className="font-medium">CSV Format Requirements:</h4>
            <ul className="list-disc pl-5 mt-1">
              <li>First row should contain column headers</li>
              <li>Required columns: firstName, lastName, email</li>
              <li>Optional columns: company, title, phone, notes, score</li>
              <li>Score values should be: "high", "medium", or "low"</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport}
            disabled={!file || importMutation.isPending}
          >
            {importMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Import Leads
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}