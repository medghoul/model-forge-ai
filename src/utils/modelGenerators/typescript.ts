
import { GenerationOptions } from '@/components/OptionsPanel';

interface Property {
  name: string;
  type: string;
  isNullable: boolean;
  isArray: boolean;
  isObject: boolean;
}

interface Model {
  name: string;
  properties: Property[];
}

const determineType = (value: any): string => {
  if (value === null) return 'any';
  if (Array.isArray(value)) {
    if (value.length === 0) return 'any[]';
    return `${determineType(value[0])}[]`;
  }
  if (typeof value === 'object') return pascalCase(Object.keys(value)[0] || 'Object');
  return typeof value;
};

const pascalCase = (str: string): string => {
  return str.charAt(0).toUpperCase() + 
    str.slice(1)
      .replace(/_([a-z])/g, (_, char) => char.toUpperCase())
      .replace(/-([a-z])/g, (_, char) => char.toUpperCase());
};

const camelCase = (str: string): string => {
  return str.charAt(0).toLowerCase() + 
    str.slice(1)
      .replace(/_([a-z])/g, (_, char) => char.toUpperCase())
      .replace(/-([a-z])/g, (_, char) => char.toUpperCase());
};

export const generateTypescriptModel = (
  data: any,
  modelName: string,
  options: GenerationOptions
): { code: string, fileName: string } => {
  // Handle array responses by using the first item
  if (Array.isArray(data) && data.length > 0) {
    data = data[0];
  }

  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid data structure for model generation');
  }

  const model: Model = {
    name: pascalCase(modelName),
    properties: []
  };

  // Extract properties
  for (const [key, value] of Object.entries(data)) {
    const propertyType = determineType(value);
    const isArray = Array.isArray(value);
    const isObject = !isArray && typeof value === 'object' && value !== null;
    
    model.properties.push({
      name: camelCase(key),
      type: propertyType,
      isNullable: value === null || options.nullSafety,
      isArray,
      isObject
    });
  }

  // Generate nested models if needed
  const nestedModels: Model[] = [];
  model.properties.forEach(prop => {
    if (prop.isObject && !prop.isArray) {
      const nestedData = data[prop.name];
      if (nestedData) {
        nestedModels.push({
          name: pascalCase(prop.type),
          properties: []
        });
        
        // Extract nested properties
        for (const [nestedKey, nestedValue] of Object.entries(nestedData)) {
          const nestedType = determineType(nestedValue);
          nestedModels[nestedModels.length - 1].properties.push({
            name: camelCase(nestedKey),
            type: nestedType,
            isNullable: nestedValue === null || options.nullSafety,
            isArray: Array.isArray(nestedValue),
            isObject: typeof nestedValue === 'object' && nestedValue !== null && !Array.isArray(nestedValue)
          });
        }
      }
    }
  });

  // Generate the TypeScript code
  let code = '';
  
  if (options.serializationOptions === 'class-transformer') {
    code += 'import { Type } from "class-transformer";\n\n';
  }

  // Generate nested models first
  nestedModels.forEach(nestedModel => {
    if (options.serializationOptions === 'type-only') {
      code += `export interface ${nestedModel.name} {\n`;
      nestedModel.properties.forEach(prop => {
        code += `  ${prop.name}${prop.isNullable ? '?' : ''}: ${prop.type};\n`;
      });
      code += '}\n\n';
    } else {
      code += `export class ${nestedModel.name} {\n`;
      
      nestedModel.properties.forEach(prop => {
        if (options.serializationOptions === 'class-transformer' && (prop.isArray || prop.isObject)) {
          code += `  @Type(() => ${prop.type.replace('[]', '')})\n`;
        }
        code += `  ${prop.name}${prop.isNullable ? '?' : ''}: ${prop.type};\n`;
      });
      
      if (options.includeConstructor) {
        code += '\n  constructor(data?: Partial<' + nestedModel.name + '>) {\n';
        code += '    if (data) {\n';
        code += '      Object.assign(this, data);\n';
        code += '    }\n';
        code += '  }\n';
      }
      
      code += '}\n\n';
    }
  });

  // Generate main model
  if (options.serializationOptions === 'type-only') {
    code += `export interface ${model.name} {\n`;
    model.properties.forEach(prop => {
      code += `  ${prop.name}${prop.isNullable ? '?' : ''}: ${prop.type};\n`;
    });
    code += '}\n';
  } else {
    code += `export class ${model.name} {\n`;
    
    model.properties.forEach(prop => {
      if (options.serializationOptions === 'class-transformer' && (prop.isArray || prop.isObject)) {
        code += `  @Type(() => ${prop.type.replace('[]', '')})\n`;
      }
      code += `  ${prop.name}${prop.isNullable ? '?' : ''}: ${prop.type};\n`;
    });
    
    if (options.includeConstructor) {
      code += '\n  constructor(data?: Partial<' + model.name + '>) {\n';
      code += '    if (data) {\n';
      code += '      Object.assign(this, data);\n';
      code += '    }\n';
      code += '  }\n';
    }
    
    code += '}\n';
  }

  return { 
    code, 
    fileName: `${model.name}Model` 
  };
};
