
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
  if (value === null) return 'dynamic';
  if (Array.isArray(value)) {
    if (value.length === 0) return 'List<dynamic>';
    return `List<${determineType(value[0]).replace('List<', '').replace('>', '')}>`;
  }
  
  const type = typeof value;
  if (type === 'object') {
    return pascalCase(Object.keys(value)[0] || 'Object');
  }
  
  // Convert JavaScript types to Dart types
  switch (type) {
    case 'string':
      return 'String';
    case 'number':
      return Number.isInteger(value) ? 'int' : 'double';
    case 'boolean':
      return 'bool';
    default:
      return 'dynamic';
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

export const generateDartModel = (
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

  // Generate the Dart code
  let code = '';
  
  if (options.serializationOptions === '@JsonSerializable') {
    code += "import 'package:json_annotation/json_annotation.dart';\n\n";
    code += "part '" + camelCase(modelName) + ".g.dart';\n\n";
  }

  // Generate nested models first
  nestedModels.forEach(nestedModel => {
    if (options.serializationOptions === '@JsonSerializable') {
      code += '@JsonSerializable()\n';
    }
    
    code += `class ${nestedModel.name} {\n`;
    
    // Properties
    nestedModel.properties.forEach(prop => {
      if (options.serializationOptions === '@JsonSerializable' && prop.name !== prop.jsonKey) {
        code += `  @JsonKey(name: '${prop.jsonKey}')\n`;
      }
      
      code += `  final ${prop.type}${prop.isNullable ? '?' : ''} ${prop.name};\n`;
    });
    
    // Constructor
    if (options.includeConstructor) {
      code += '\n  ${nestedModel.name}({\n';
      nestedModel.properties.forEach(prop => {
        const requiredKeyword = !prop.isNullable && options.nullSafety ? 'required ' : '';
        code += `    ${requiredKeyword}this.${prop.name},\n`;
      });
      code += '  });\n\n';
    } else {
      code += '\n';
    }
    
    // Serialization methods
    if (options.serializationOptions === '@JsonSerializable') {
      code += `  factory ${nestedModel.name}.fromJson(Map<String, dynamic> json) => _$${nestedModel.name}FromJson(json);\n`;
      code += `  Map<String, dynamic> toJson() => _$${nestedModel.name}ToJson(this);\n`;
    } else if (options.serializationOptions === 'fromJson/toJson') {
      code += `  factory ${nestedModel.name}.fromJson(Map<String, dynamic> json) {\n`;
      code += '    return ${nestedModel.name}(\n';
      nestedModel.properties.forEach(prop => {
        if (prop.isObject && !prop.isArray) {
          code += `      ${prop.name}: json['${prop.jsonKey}'] != null ? ${prop.type}.fromJson(json['${prop.jsonKey}']) : ${prop.isNullable ? 'null' : `${prop.type}()`},\n`;
        } else if (prop.isArray && prop.isObject) {
          const itemType = prop.type.replace('List<', '').replace('>', '');
          code += `      ${prop.name}: json['${prop.jsonKey}'] != null ? List<${itemType}>.from(json['${prop.jsonKey}'].map((x) => ${itemType}.fromJson(x))) : ${prop.isNullable ? 'null' : '[]'},\n`;
        } else {
          code += `      ${prop.name}: json['${prop.jsonKey}'],\n`;
        }
      });
      code += '    );\n';
      code += '  }\n\n';
      
      code += '  Map<String, dynamic> toJson() {\n';
      code += '    return {\n';
      nestedModel.properties.forEach(prop => {
        if (prop.isObject && !prop.isArray) {
          code += `      '${prop.jsonKey}': ${prop.name}${prop.isNullable ? '?' : ''}.toJson(),\n`;
        } else if (prop.isArray && prop.type !== 'List<dynamic>' && prop.isObject) {
          code += `      '${prop.jsonKey}': ${prop.name}${prop.isNullable ? '?' : ''}.map((x) => x.toJson()).toList(),\n`;
        } else {
          code += `      '${prop.jsonKey}': ${prop.name},\n`;
        }
      });
      code += '    };\n';
      code += '  }\n';
    }
    
    code += '}\n\n';
  });

  // Generate main model
  if (options.serializationOptions === '@JsonSerializable') {
    code += '@JsonSerializable()\n';
  }
  
  code += `class ${model.name} {\n`;
  
  // Properties
  model.properties.forEach(prop => {
    if (options.serializationOptions === '@JsonSerializable' && prop.name !== prop.jsonKey) {
      code += `  @JsonKey(name: '${prop.jsonKey}')\n`;
    }
    
    code += `  final ${prop.type}${prop.isNullable ? '?' : ''} ${prop.name};\n`;
  });
  
  // Constructor
  if (options.includeConstructor) {
    code += '\n  ${model.name}({\n';
    model.properties.forEach(prop => {
      const requiredKeyword = !prop.isNullable && options.nullSafety ? 'required ' : '';
      code += `    ${requiredKeyword}this.${prop.name},\n`;
    });
    code += '  });\n\n';
  } else {
    code += '\n';
  }
  
  // Serialization methods
  if (options.serializationOptions === '@JsonSerializable') {
    code += `  factory ${model.name}.fromJson(Map<String, dynamic> json) => _$${model.name}FromJson(json);\n`;
    code += `  Map<String, dynamic> toJson() => _$${model.name}ToJson(this);\n`;
  } else if (options.serializationOptions === 'fromJson/toJson') {
    code += `  factory ${model.name}.fromJson(Map<String, dynamic> json) {\n`;
    code += `    return ${model.name}(\n`;
    model.properties.forEach(prop => {
      if (prop.isObject && !prop.isArray) {
        code += `      ${prop.name}: json['${prop.jsonKey}'] != null ? ${prop.type}.fromJson(json['${prop.jsonKey}']) : ${prop.isNullable ? 'null' : `${prop.type}()`},\n`;
      } else if (prop.isArray && prop.isObject) {
        const itemType = prop.type.replace('List<', '').replace('>', '');
        code += `      ${prop.name}: json['${prop.jsonKey}'] != null ? List<${itemType}>.from(json['${prop.jsonKey}'].map((x) => ${itemType}.fromJson(x))) : ${prop.isNullable ? 'null' : '[]'},\n`;
      } else {
        code += `      ${prop.name}: json['${prop.jsonKey}'],\n`;
      }
    });
    code += '    );\n';
    code += '  }\n\n';
    
    code += '  Map<String, dynamic> toJson() {\n';
    code += '    return {\n';
    model.properties.forEach(prop => {
      if (prop.isObject && !prop.isArray) {
        code += `      '${prop.jsonKey}': ${prop.name}${prop.isNullable ? '?' : ''}.toJson(),\n`;
      } else if (prop.isArray && prop.type !== 'List<dynamic>' && prop.isObject) {
        code += `      '${prop.jsonKey}': ${prop.name}${prop.isNullable ? '?' : ''}.map((x) => x.toJson()).toList(),\n`;
      } else {
        code += `      '${prop.jsonKey}': ${prop.name},\n`;
      }
    });
    code += '    };\n';
    code += '  }\n';
  }
  
  code += '}\n';

  return { 
    code, 
    fileName: camelCase(modelName) 
  };
};
