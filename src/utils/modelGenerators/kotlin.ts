
import { GenerationOptions } from '@/components/OptionsPanel';

interface Property {
  name: string;
  type: string;
  isNullable: boolean;
  isArray: boolean;
  isObject: boolean;
  jsonKey: string;
}

interface Model {
  name: string;
  properties: Property[];
}

const determineType = (value: any): string => {
  if (value === null) return 'Any';
  if (Array.isArray(value)) {
    if (value.length === 0) return 'List<Any>';
    return `List<${determineType(value[0])}>`;
  }
  
  const type = typeof value;
  if (type === 'object') {
    return pascalCase(Object.keys(value)[0] || 'Object');
  }
  
  // Convert JavaScript types to Kotlin types
  switch (type) {
    case 'string':
      return 'String';
    case 'number':
      return Number.isInteger(value) ? 'Int' : 'Double';
    case 'boolean':
      return 'Boolean';
    default:
      return 'Any';
  }
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

export const generateKotlinModel = (
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
      jsonKey: key,
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
      const nestedData = data[prop.jsonKey];
      if (nestedData) {
        nestedModels.push({
          name: pascalCase(prop.type),
          properties: []
        });
        
        for (const [nestedKey, nestedValue] of Object.entries(nestedData)) {
          const nestedType = determineType(nestedValue);
          nestedModels[nestedModels.length - 1].properties.push({
            name: camelCase(nestedKey),
            jsonKey: nestedKey,
            type: nestedType,
            isNullable: nestedValue === null || options.nullSafety,
            isArray: Array.isArray(nestedValue),
            isObject: typeof nestedValue === 'object' && nestedValue !== null && !Array.isArray(nestedValue)
          });
        }
      }
    }
  });

  // Generate the Kotlin code
  let code = '';
  const packageName = `package com.example.models\n\n`;
  
  code += packageName;
  
  if (options.serializationOptions === '@Serializable') {
    code += "import kotlinx.serialization.*\n";
  } else if (options.serializationOptions === 'Jackson') {
    code += "import com.fasterxml.jackson.annotation.*\n";
  } else if (options.serializationOptions === 'Gson') {
    code += "import com.google.gson.annotations.*\n";
  }

  code += '\n';

  // Generate nested models first
  nestedModels.forEach(nestedModel => {
    if (options.serializationOptions === '@Serializable') {
      code += '@Serializable\n';
    }
    
    code += options.includeConstructor ? `data class ${nestedModel.name}(\n` : `class ${nestedModel.name} {\n`;
    
    // Properties
    if (options.includeConstructor) {
      nestedModel.properties.forEach((prop, index) => {
        const isLast = index === nestedModel.properties.length - 1;
        
        if (options.serializationOptions === '@Serializable' && prop.name !== prop.jsonKey) {
          code += `    @SerialName("${prop.jsonKey}")\n`;
        } else if (options.serializationOptions === 'Jackson' && prop.name !== prop.jsonKey) {
          code += `    @JsonProperty("${prop.jsonKey}")\n`;
        } else if (options.serializationOptions === 'Gson' && prop.name !== prop.jsonKey) {
          code += `    @SerializedName("${prop.jsonKey}")\n`;
        }
        
        code += `    val ${prop.name}: ${prop.type}${prop.isNullable ? '?' : ''}${isLast ? '' : ','}\n`;
      });
      code += ')\n\n';
    } else {
      nestedModel.properties.forEach(prop => {
        if (options.serializationOptions === '@Serializable' && prop.name !== prop.jsonKey) {
          code += `    @SerialName("${prop.jsonKey}")\n`;
        } else if (options.serializationOptions === 'Jackson' && prop.name !== prop.jsonKey) {
          code += `    @JsonProperty("${prop.jsonKey}")\n`;
        } else if (options.serializationOptions === 'Gson' && prop.name !== prop.jsonKey) {
          code += `    @SerializedName("${prop.jsonKey}")\n`;
        }
        
        code += `    var ${prop.name}: ${prop.type}${prop.isNullable ? '?' : ''} = ${prop.isNullable ? 'null' : prop.type === 'String' ? '""' : prop.isArray ? 'listOf()' : prop.isObject ? prop.type + '()' : prop.type === 'Boolean' ? 'false' : '0'}\n`;
      });
      code += '}\n\n';
    }
  });

  // Generate main model
  if (options.serializationOptions === '@Serializable') {
    code += '@Serializable\n';
  }
  
  code += options.includeConstructor ? `data class ${model.name}(\n` : `class ${model.name} {\n`;
  
  // Properties
  if (options.includeConstructor) {
    model.properties.forEach((prop, index) => {
      const isLast = index === model.properties.length - 1;
      
      if (options.serializationOptions === '@Serializable' && prop.name !== prop.jsonKey) {
        code += `    @SerialName("${prop.jsonKey}")\n`;
      } else if (options.serializationOptions === 'Jackson' && prop.name !== prop.jsonKey) {
        code += `    @JsonProperty("${prop.jsonKey}")\n`;
      } else if (options.serializationOptions === 'Gson' && prop.name !== prop.jsonKey) {
        code += `    @SerializedName("${prop.jsonKey}")\n`;
      }
      
      code += `    val ${prop.name}: ${prop.type}${prop.isNullable ? '?' : ''}${isLast ? '' : ','}\n`;
    });
    code += ')';
  } else {
    model.properties.forEach(prop => {
      if (options.serializationOptions === '@Serializable' && prop.name !== prop.jsonKey) {
        code += `    @SerialName("${prop.jsonKey}")\n`;
      } else if (options.serializationOptions === 'Jackson' && prop.name !== prop.jsonKey) {
        code += `    @JsonProperty("${prop.jsonKey}")\n`;
      } else if (options.serializationOptions === 'Gson' && prop.name !== prop.jsonKey) {
        code += `    @SerializedName("${prop.jsonKey}")\n`;
      }
      
      code += `    var ${prop.name}: ${prop.type}${prop.isNullable ? '?' : ''} = ${prop.isNullable ? 'null' : prop.type === 'String' ? '""' : prop.isArray ? 'listOf()' : prop.isObject ? prop.type + '()' : prop.type === 'Boolean' ? 'false' : '0'}\n`;
    });
    code += '}';
  }

  return { 
    code, 
    fileName: model.name 
  };
};
