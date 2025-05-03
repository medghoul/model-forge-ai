
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { RequestOptions } from "@/utils/fetcher";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface UrlInputProps {
  onFetch: (url: string, options: RequestOptions) => Promise<void>;
  isLoading: boolean;
}

const UrlInput = ({ onFetch, isLoading }: UrlInputProps) => {
  const [url, setUrl] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string>("");
  const [customHeaders, setCustomHeaders] = useState<string>("");
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      // Parse custom headers if provided
      let headers: Record<string, string> = {};
      try {
        if (customHeaders.trim()) {
          // Parse each line as a key-value pair
          const headerLines = customHeaders.split('\n');
          headerLines.forEach(line => {
            const [key, value] = line.split(':').map(part => part.trim());
            if (key && value) {
              headers[key] = value;
            }
          });
        }
      } catch (error) {
        console.error('Error parsing headers:', error);
      }

      const options: RequestOptions = {
        ...(authToken ? { authToken } : {}),
        ...(Object.keys(headers).length > 0 ? { headers } : {})
      };
      
      await onFetch(url, options);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-2">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter API URL (e.g., https://api.example.com/users)"
            className="w-full p-2 border rounded-md bg-secondary text-foreground"
          />
        </div>
        <Button 
          type="submit" 
          className="bg-orange-gradient hover:opacity-90 transition-opacity"
          disabled={isLoading || !url}
        >
          {isLoading ? "Fetching..." : "Generate Models"} 
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="pt-2">
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center text-muted-foreground hover:text-foreground p-0"
            >
              {showAdvanced ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
              Advanced Options
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-3">
            <div>
              <label htmlFor="authToken" className="text-sm font-medium block mb-1">
                Authorization Token
              </label>
              <Input
                id="authToken"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                placeholder="Bearer token (without 'Bearer' prefix)"
                className="w-full bg-secondary text-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Will be sent as "Authorization: Bearer {token}"
              </p>
            </div>
            <div>
              <label htmlFor="customHeaders" className="text-sm font-medium block mb-1">
                Custom Headers
              </label>
              <textarea
                id="customHeaders"
                value={customHeaders}
                onChange={(e) => setCustomHeaders(e.target.value)}
                placeholder="Content-Type: application/json&#10;X-App-Version: 1.0.0"
                className="w-full h-20 p-2 border rounded-md bg-secondary text-foreground resize-y"
              />
              <p className="text-xs text-muted-foreground mt-1">
                One header per line in "Key: Value" format
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </form>
  );
};

export default UrlInput;
