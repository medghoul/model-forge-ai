
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { SupportedLanguage } from './LanguageSelector';
import { Card, CardContent } from '@/components/ui/card';

export interface GenerationOptions {
  includeConstructor: boolean;
  nullSafety: boolean;
  serializationOptions: string;
}

interface OptionsPanelProps {
  options: GenerationOptions;
  setOptions: React.Dispatch<React.SetStateAction<GenerationOptions>>;
  selectedLanguage: SupportedLanguage;
}

const OptionsPanel = ({ options, setOptions, selectedLanguage }: OptionsPanelProps) => {
  const serializationOptions = {
    typescript: ['none', 'class-transformer', 'type-only'],
    dart: ['none', '@JsonSerializable', 'fromJson/toJson'],
    kotlin: ['none', '@Serializable', 'Jackson', 'Gson']
  };

  const currentSerializationOptions = serializationOptions[selectedLanguage];

  return (
    <Card className="border border-secondary">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="constructor" 
              checked={options.includeConstructor}
              onCheckedChange={(checked) => 
                setOptions({...options, includeConstructor: checked === true})
              }
            />
            <Label htmlFor="constructor" className="cursor-pointer">Include Constructor</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="nullSafety" 
              checked={options.nullSafety}
              onCheckedChange={(checked) => 
                setOptions({...options, nullSafety: checked === true})
              }
            />
            <Label htmlFor="nullSafety" className="cursor-pointer">Null Safety</Label>
          </div>
          
          <div className="w-full">
            <Select 
              value={options.serializationOptions}
              onValueChange={(value) => 
                setOptions({...options, serializationOptions: value})
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Serialization" />
              </SelectTrigger>
              <SelectContent>
                {currentSerializationOptions.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OptionsPanel;
