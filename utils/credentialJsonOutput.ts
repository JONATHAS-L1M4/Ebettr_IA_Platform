
/**
 * Utility to standardize JSON payload output for credential forms.
 */

export function deepSortKeys(value: any): any {
  if (Array.isArray(value)) {
    return value.map(deepSortKeys);
  }
  if (value && typeof value === 'object' && value.constructor === Object) {
    return Object.keys(value)
      .sort()
      .reduce((acc: any, key) => {
        acc[key] = deepSortKeys(value[key]);
        return acc;
      }, {});
  }
  return value;
}

export function toJson(payload: any, pretty = true, space = 2): string | any {
  return pretty ? JSON.stringify(payload, null, space) : payload;
}

export interface CredentialJsonOptions {
  type?: string;
  name?: string;
  pretty?: boolean;
  space?: number;
  wrap?: boolean;
}

export function createCredentialJsonOutput(options: CredentialJsonOptions = {}) {
  const { type, name, pretty = true, space = 2, wrap = true } = options;

  if (wrap !== false && !type) {
    throw new Error('type is required to build credential payload output');
  }

  return (data: any = {}) => {
    const payload = wrap === false
      ? deepSortKeys(data)
      : deepSortKeys({
          type,
          name: name || type,
          data,
        });

    return toJson(payload, pretty, space);
  };
}

export function standardJsonOutput(data: any = {}, options: { pretty?: boolean; space?: number } = {}) {
  const { pretty = true, space = 2 } = options;
  const payload = deepSortKeys(data);
  return toJson(payload, pretty, space);
}

/**
 * Extracts conditional visibility logic from 'allOf' JSON Schema structures.
 * Maps 'if' conditions to 'show' rules for fields defined in 'then'.
 */
export function extractConditionalShows(jsonSchema: any) {
  const map: Record<string, { show: Record<string, any[]> }> = {};
  const allOf = Array.isArray(jsonSchema?.allOf) ? jsonSchema.allOf : [];

  allOf.forEach((entry: any) => {
    const condProps = entry?.if?.properties;
    if (!condProps || typeof condProps !== 'object') return;
    
    // We assume simple 1-dependency check for now
    const dep = Object.keys(condProps)[0];
    if (!dep) return;
    
    const valueSchema = condProps[dep];
    // Support 'const' or 'enum' in the 'if' block
    let targetValues: any[] = [];
    if (valueSchema?.const !== undefined) {
        targetValues = [valueSchema.const];
    } else if (Array.isArray(valueSchema?.enum)) {
        targetValues = valueSchema.enum;
    }
    
    if (targetValues.length === 0) return;

    // 'then' can be a schema object or have its own allOf
    const thenBlock = entry?.then;
    if (!thenBlock) return;

    const blocksToProcess = Array.isArray(thenBlock.allOf) ? thenBlock.allOf : (thenBlock ? [thenBlock] : []);

    blocksToProcess.forEach((block: any) => {
        const req = Array.isArray(block?.required) ? block.required : [];
        const props = block?.properties ? Object.keys(block.properties) : [];
        
        // Fields that appear in 'then' (either as required or defined properties) 
        // are conditional on the 'if'.
        const affectedFields = new Set([...req, ...props]);
        
        affectedFields.forEach((field: string) => {
            if (!map[field]) map[field] = { show: {} };
            if (!map[field].show[dep]) map[field].show[dep] = [];
            
            // Add values, avoiding duplicates
            targetValues.forEach(val => {
                if (!map[field].show[dep].includes(val)) {
                    map[field].show[dep].push(val);
                }
            });
        });
    });
  });

  return map;
}

export function convertJsonSchemaToFields(jsonSchema: any) {
    if (!jsonSchema || !jsonSchema.properties) return null;
    const required = Array.isArray(jsonSchema.required) ? jsonSchema.required : [];
    const conditional = extractConditionalShows(jsonSchema);

    return Object.entries(jsonSchema.properties).map(([name, def]: [string, any]) => {
      const hasEnum = Array.isArray(def.enum) && def.enum.length > 0;
      const type = hasEnum
        ? 'options'
        : def.type === 'boolean'
        ? 'boolean'
        : def.type === 'number' || def.type === 'integer'
        ? 'number'
        : 'string';

      const field: any = {
        name,
        displayName: name,
        type,
        required: required.includes(name),
        default: hasEnum ? def.enum[0] : type === 'boolean' ? false : '',
      };

      if (hasEnum) {
        field.options = def.enum.map((value: any) => ({ value, name: String(value) }));
      }

      if (conditional[name]?.show) {
        field.displayOptions = { show: conditional[name].show };
      }

      return field;
    });
}

export function normalizeCredentialInput(parsed: any) {
    if (Array.isArray(parsed) && parsed.length === 1 && parsed[0]?.properties) {
      return { schema: convertJsonSchemaToFields(parsed[0]) };
    }

    if (parsed?.properties) {
      return {
        schema: convertJsonSchemaToFields(parsed),
        defaults: parsed.defaults,
        type: parsed.type,
        name: parsed.name,
      };
    }

    if (parsed?.schema?.properties) {
      return {
        schema: convertJsonSchemaToFields(parsed.schema),
        defaults: parsed.defaults,
        type: parsed.type,
        name: parsed.name,
      };
    }

    if (parsed?.schema && Array.isArray(parsed.schema)) {
      return parsed;
    }

    if (Array.isArray(parsed)) {
      return { schema: parsed };
    }

    return parsed;
}
