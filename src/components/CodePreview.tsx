
import { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface CodePreviewProps {
  code: string;
  language: string;
  fileName: string;
}

const CodePreview = ({ code, language, fileName }: CodePreviewProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast({
        title: "Copied to clipboard!",
        description: "The generated code has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const fileExtension = language === 'typescript' ? 'ts' : 
                         language === 'dart' ? 'dart' : 
                         language === 'kotlin' ? 'kt' : 'txt';
    
    const file = new Blob([code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${fileName}.${fileExtension}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Download started!",
      description: `${fileName}.${fileExtension} is being downloaded.`,
    });
  };

  return (
    <Card className="mt-4 border-secondary bg-secondary/20">
      <CardContent className="p-0">
        <div className="flex justify-between items-center p-2 bg-secondary">
          <span className="text-sm font-medium">{fileName}</span>
          <div className="space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleCopy} 
              className="h-8 px-2 text-xs"
            >
              {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleDownload}
              className="h-8 px-2 text-xs"
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              Download
            </Button>
          </div>
        </div>
        <pre className="p-4 m-0 overflow-auto max-h-[500px] bg-secondary/30 rounded-b-lg">
          <code className="language-{language}">{code}</code>
        </pre>
      </CardContent>
    </Card>
  );
};

export default CodePreview;
