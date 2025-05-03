import { useState } from 'react';
import UrlInput from '@/components/UrlInput';
import LanguageSelector from '@/components/LanguageSelector';
import OptionsPanel, { GenerationOptions } from '@/components/OptionsPanel';
import CodePreview from '@/components/CodePreview';
import { fetchData, RequestOptions } from '@/utils/fetcher';
import { generateTypescriptModel } from '@/utils/modelGenerators/typescript';
import { generateDartModel } from '@/utils/modelGenerators/dart';
import { generateKotlinModel } from '@/utils/modelGenerators/kotlin';
import type { SupportedLanguage } from '@/components/LanguageSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [jsonData, setJsonData] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('typescript');
  const [generatedCode, setGeneratedCode] = useState<{ code: string; fileName: string } | null>(null);
  const [options, setOptions] = useState<GenerationOptions>({
    includeConstructor: true,
    nullSafety: true,
    serializationOptions: 'none'
  });
  const { toast } = useToast();

  const handleLanguageChange = (language: SupportedLanguage) => {
    setSelectedLanguage(language);
    
    // Update serialization options based on language
    let defaultOption = 'none';
    if (language === 'typescript') defaultOption = 'none';
    else if (language === 'dart') defaultOption = 'none';
    else if (language === 'kotlin') defaultOption = 'none';
    
    setOptions({
      ...options,
      serializationOptions: defaultOption
    });
    
    // Regenerate code if we have data
    if (jsonData) {
      generateModel(jsonData);
    }
  };

  const generateModel = (data: any) => {
    try {
      let result;
      const modelName = 'Model';
      
      switch (selectedLanguage) {
        case 'typescript':
          result = generateTypescriptModel(data, modelName, options);
          break;
        case 'dart':
          result = generateDartModel(data, modelName, options);
          break;
        case 'kotlin':
          result = generateKotlinModel(data, modelName, options);
          break;
      }
      
      setGeneratedCode(result);
    } catch (error) {
      console.error("Error generating model:", error);
      toast({
        title: "Error generating model",
        description: "The JSON structure could not be processed correctly.",
        variant: "destructive"
      });
    }
  };

  const handleFetch = async (url: string, requestOptions: RequestOptions = {}) => {
    setIsLoading(true);
    try {
      const data = await fetchData(url, requestOptions);
      setJsonData(data);
      generateModel(data);
      toast({
        title: "Data fetched successfully!",
        description: "Your model has been generated.",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error fetching data",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col items-center justify-center mb-8 text-center">
        <h1 className="text-4xl font-bold orange-gradient-text mb-2">ModelBuilder AI</h1>
        <p className="text-muted-foreground max-w-lg">
          Generate data models in various programming languages from JSON API responses
        </p>
      </div>

      <Card className="mb-6 border-secondary bg-secondary/20">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">Enter API URL</CardTitle>
        </CardHeader>
        <CardContent>
          <UrlInput onFetch={handleFetch} isLoading={isLoading} />
        </CardContent>
      </Card>

      {jsonData && (
        <div className="animate-fade-in">
          <div className="grid grid-cols-1 gap-6 mb-6">
            <Card className="border-secondary bg-secondary/20">
              <CardHeader className="pb-0">
                <CardTitle className="text-lg">Model Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <LanguageSelector 
                    selectedLanguage={selectedLanguage} 
                    onChange={handleLanguageChange} 
                  />
                  <Separator />
                  <OptionsPanel 
                    options={options} 
                    setOptions={setOptions}
                    selectedLanguage={selectedLanguage}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {generatedCode && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-medium mb-2">Generated Model</h2>
              <CodePreview 
                code={generatedCode.code} 
                language={selectedLanguage}
                fileName={generatedCode.fileName}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Index;
