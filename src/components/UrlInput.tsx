
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";

interface UrlInputProps {
  onFetch: (url: string) => Promise<void>;
  isLoading: boolean;
}

const UrlInput = ({ onFetch, isLoading }: UrlInputProps) => {
  const [url, setUrl] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      await onFetch(url);
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
    </form>
  );
};

export default UrlInput;
