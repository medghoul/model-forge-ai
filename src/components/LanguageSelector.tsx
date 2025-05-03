
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type SupportedLanguage = 'typescript' | 'dart' | 'kotlin';

interface LanguageSelectorProps {
  selectedLanguage: SupportedLanguage;
  onChange: (language: SupportedLanguage) => void;
}

const LanguageSelector = ({ selectedLanguage, onChange }: LanguageSelectorProps) => {
  return (
    <Tabs defaultValue={selectedLanguage} className="w-full" onValueChange={(value) => onChange(value as SupportedLanguage)}>
      <TabsList className="grid grid-cols-3 w-full mb-4">
        <TabsTrigger value="typescript">TypeScript</TabsTrigger>
        <TabsTrigger value="dart">Dart</TabsTrigger>
        <TabsTrigger value="kotlin">Kotlin</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default LanguageSelector;
