
import { ConfigField, FieldType, SelectOption } from '../../types';
import { WorkflowCredential, CredentialSchemaResult } from './types';
import { safeJsonParse } from './core';
import { extractConditionalShows } from '../../utils/credentialJsonOutput';

const API_BASE = process.env.API_BASE;

const getAuthHeaders = () => {
    const token = localStorage.getItem('ebettr_access_token');
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'accept': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

const handleResponse = async (response: Response, errorMsg: string) => {
    if (!response.ok) {
        const text = await response.text().catch(() => response.statusText);
        let errMsg = `${errorMsg} (${response.status})`;
        try {
            const errJson = JSON.parse(text);
            if (errJson.detail) errMsg = errJson.detail;
            else if (errJson.message) errMsg = errJson.message;
        } catch {}
        throw new Error(errMsg);
    }
    const text = await response.text();
    return safeJsonParse(text) || text;
};

export const updateN8nCredential = async (
  credentialId: string,
  payload: { name: string; type: string; data: any }
): Promise<any> => {
  const url = `${API_BASE}/credentials/${credentialId}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
    credentials: 'include'
  });

  return await handleResponse(response, 'Falha ao atualizar credencial');
};

export const testN8nCredential = async (
  workflowId: string,
  credentialsData: any
): Promise<{ status: 'OK' | 'Error'; message: string }> => {
  const url = `${API_BASE}/credentials/test?workflowId=${encodeURIComponent(workflowId)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ credentials: credentialsData }),
    credentials: 'include'
  });

  const data = await handleResponse(response, 'Falha ao testar credencial');

  // Suporte ao formato de array retornado pelo n8n
  const responseData = Array.isArray(data) ? data[0] : data;

  // Normaliza a resposta baseada no formato fornecido pelo usuário
  if (responseData?.data) {
      return responseData.data;
  }
  
  if (responseData?.status) return responseData;

  // Fallback se a estrutura for diferente
  return { status: 'Error', message: 'Resposta inválida do servidor de teste.' };
};

// --- CREDENTIAL PARSER LOGIC ---

function extractBlock(source: string, keyword: string): string | null {
  const modifiers = '(?:(?:public|private|protected|readonly|static)\\s+)*';
  const typeDef = '(?::\\s*[^=]+)?';

  const regex = new RegExp(`${modifiers}${keyword}\\s*${typeDef}=\\s*\\[`, 'g');
  const match = regex.exec(source);

  if (!match) return null;

  const startIdx = match.index + match[0].length - 1;

  let nesting = 0;
  let state: 'code' | 'string_single' | 'string_double' | 'string_template' | 'comment_single' | 'comment_multi' = 'code';

  for (let i = startIdx; i < source.length; i++) {
    const char = source[i];
    const nextChar = source[i + 1];
    const prevChar = source[i - 1];

    switch (state) {
      case 'code':
        if (char === "'") state = 'string_single';
        else if (char === '"') state = 'string_double';
        else if (char === '`') state = 'string_template';
        else if (char === '/' && nextChar === '/') state = 'comment_single';
        else if (char === '/' && nextChar === '*') state = 'comment_multi';
        else if (char === '[') nesting++;
        else if (char === ']') nesting--;
        break;
      case 'string_single':
        if (char === "'" && prevChar !== '\\') state = 'code';
        break;
      case 'string_double':
        if (char === '"' && prevChar !== '\\') state = 'code';
        break;
      case 'string_template':
        if (char === '`' && prevChar !== '\\') state = 'code';
        break;
      case 'comment_single':
        if (char === '\n') state = 'code';
        break;
      case 'comment_multi':
        if (char === '*' && nextChar === '/') {
          state = 'code';
          i++;
        }
        break;
    }

    if (nesting === 0 && state === 'code') {
      return source.substring(startIdx, i + 1);
    }
  }

  return null;
}

function parseCredentialSource(source: string, typeName: string) {
  try {
    const propertiesStr = extractBlock(source, 'properties');
    const extendsStr = extractBlock(source, 'extends');

    let preamble = '';
    const classRegex = new RegExp(`export\\s+class\\s+${typeName}`, 'i');
    const classMatch = classRegex.exec(source);

    if (classMatch) {
      const rawPreamble = source.substring(0, classMatch.index);
      preamble = rawPreamble.replace(/^import\s+.*$/gm, '').replace(/.*require\(.*$/gm, '').trim();
    }

    let properties: any[] = [];
    let extendsList: string[] = [];

    if (propertiesStr) {
      try {
        const safeStr = propertiesStr.replace(/\.\.\.[a-zA-Z0-9_$]+/g, '').replace(/this\.[a-zA-Z0-9_$]+/g, 'null');
        const fn = new Function(`try { ${preamble} } catch(e) {} return ${safeStr};`);
        properties = fn();
      } catch (e) {
        console.warn(`Failed to parse properties for ${typeName}`, e);
      }
    }

    if (extendsStr) {
      try {
        const safeExtends = extendsStr.replace(/\.\.\.[a-zA-Z0-9_$]+/g, '').replace(/this\.[a-zA-Z0-9_$]+/g, 'null');
        const fn = new Function(`return ${safeExtends};`);
        extendsList = fn();
      } catch (e) {
        console.warn(`Failed to parse extends for ${typeName}`, e);
      }
    }

    return { name: typeName, properties, extends: extendsList };
  } catch (e) {
    console.error(`Parser error for ${typeName}`, e);
    return { name: typeName, properties: [], extends: [] };
  }
}

export const isN8nFieldVisible = (field: ConfigField, values: any) => {
  if (field.type === 'hidden') return false;
  if (!field.n8nDisplayOptions) return true;
  const { show, hide } = field.n8nDisplayOptions;

  if (show) {
    const showSatisfied = Object.entries(show).every(([dep, allowed]) => {
      const currentVal = values[dep];
      const allowedArr = Array.isArray(allowed) ? allowed : [allowed];
      return allowedArr.includes(currentVal);
    });
    if (!showSatisfied) return false;
  }

  if (hide) {
    const hideTriggered = Object.entries(hide).some(([dep, disallowed]) => {
      const currentVal = values[dep];
      const disallowedArr = Array.isArray(disallowed) ? disallowed : [disallowed];
      return disallowedArr.includes(currentVal);
    });
    if (hideTriggered) return false;
  }

  return true;
};

function mergePropertyLists(base: any[], incoming: any[]) {
  if (!incoming) return base;
  const merged = [...base];
  incoming.forEach((prop) => {
    const idx = merged.findIndex((p) => p.name === prop.name);
    if (idx >= 0) merged[idx] = prop;
    else merged.push(prop);
  });
  return merged;
}

interface CredentialPropertiesResponse {
  properties: any[];
  defaults: Record<string, any>;
  payload: Record<string, any>;
  merged: boolean;
}

// Cache global para schemas de credenciais
const credentialSchemaCache = new Map<string, CredentialPropertiesResponse>();
const pendingSchemaRequests = new Map<string, Promise<CredentialPropertiesResponse>>();

export const fetchCredentialProperties = async (
  credentialType: string,
  seen = new Set<string>()
): Promise<CredentialPropertiesResponse> => {
  // Verifica cache global e requests pendentes (apenas para a chamada inicial)
  if (seen.size === 0) {
      if (credentialSchemaCache.has(credentialType)) {
          return credentialSchemaCache.get(credentialType)!;
      }
      if (pendingSchemaRequests.has(credentialType)) {
          return pendingSchemaRequests.get(credentialType)!;
      }
  }

  const promise = fetchCredentialPropertiesLogic(credentialType, seen);

  if (seen.size === 0) {
      pendingSchemaRequests.set(credentialType, promise);
      promise.finally(() => pendingSchemaRequests.delete(credentialType));
  }

  return promise;
};

const fetchCredentialPropertiesLogic = async (
  credentialType: string,
  seen: Set<string>
): Promise<CredentialPropertiesResponse> => {
  if (!credentialType) return { properties: [], defaults: {}, payload: {}, merged: false };
  if (seen.has(credentialType)) return { properties: [], defaults: {}, payload: {}, merged: false };
  
  // Cache check removed from here as it is handled in wrapper

  seen.add(credentialType);

  const url = `${API_BASE}/credentials/schema/${credentialType}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const resAny = await handleResponse(response, `Schema not found for ${credentialType}`);
    let credentialData: any = resAny;

    if (typeof resAny === 'string') {
      const text = resAny.trim();
      if (text.startsWith('{') || text.startsWith('[')) {
        const parsed = safeJsonParse(text);
        if (parsed) credentialData = parsed;
        else credentialData = parseCredentialSource(text, credentialType);
      } else {
        credentialData = parseCredentialSource(text, credentialType);
      }
    }

    let result: CredentialPropertiesResponse = {
      properties: [],
      defaults: {},
      payload: {},
      merged: false,
    };

    if (typeof credentialData === 'object' && credentialData) {
      if (credentialData.schema && Array.isArray(credentialData.schema)) {
        result = {
          properties: credentialData.schema.map((f: any) => ({
            ...f,
            displayName: f.displayName,
            name: f.name,
            type: f.type,
            default: f.default,
            typeOptions: f.typeOptions,
            displayOptions: f.displayOptions,
            options: f.options,
          })),
          defaults: credentialData.defaults || {},
          payload: credentialData.payload || {},
          merged: true,
        };
      } else if (credentialData.properties && credentialData.allOf) {
        const conditionalMap = extractConditionalShows(credentialData);
        const properties = Object.entries(credentialData.properties).map(([key, def]: [string, any]) => {
          const displayOptions = conditionalMap[key] ? conditionalMap[key] : undefined;
          return {
            name: key,
            displayName: def.displayName || key,
            type: def.type,
            default: def.default,
            options: def.enum ? def.enum.map((v: any) => ({ name: String(v), value: v })) : def.options,
            displayOptions: displayOptions,
            typeOptions: def.typeOptions,
            required: credentialData.required?.includes(key),
            description: def.description,
            placeholder: def.placeholder,
          };
        });
        result = {
          properties,
          defaults: credentialData.defaults || {},
          payload: {},
          merged: true,
        };
      } else {
        if (!credentialData) throw new Error('No data');

        let properties: any[] = [];
        const extendsList: string[] = credentialData.extends || [];

        for (const parentName of extendsList) {
          const parent = await fetchCredentialProperties(parentName, seen);
          properties = mergePropertyLists(properties, parent.properties);
        }

        if (credentialData.properties) {
          properties = mergePropertyLists(properties, credentialData.properties);
        }

        if (Array.isArray(credentialData.__overwrittenProperties)) {
          properties = properties.filter((p) => !credentialData.__overwrittenProperties.includes(p.name));
        }

        result = {
          properties,
          defaults: {},
          payload: {},
          merged: false,
        };
      }
    }
    
    // Salva no cache global se for a chamada raiz e tiver sucesso
    if (seen.size === 1) {
        credentialSchemaCache.set(credentialType, result);
    }

    return result;

  } catch (err) {
    throw err;
  }
};

const resolveN8nPropertyToConfigField = (prop: any): ConfigField => {
  let type: FieldType = 'text';
  let options: SelectOption[] | undefined = undefined;
  let secret = false;
  let defaultValue = prop.default;
  const typeOptions = prop.typeOptions || {};

  if (prop.type === 'integer' || prop.type === 'number') {
    type = 'number_int';
    if (prop.type === 'number' || typeOptions.numberPrecision) type = 'number_dec';
  } else if (prop.type === 'boolean') {
    type = 'switch';
    if (defaultValue === undefined) defaultValue = false;
  } else if (prop.options || prop.type === 'options') {
    type = 'select';
    if (prop.options && Array.isArray(prop.options)) {
      options = prop.options.map((opt: any) => ({
        label: opt.name || opt.displayName || String(opt.value),
        value: opt.value,
      }));
    }
  } else if (prop.type === 'notice') {
    type = 'notice';
  } else if (prop.type === 'hidden') {
    type = 'hidden';
  } else {
    type = 'text';
    if (typeOptions.password) secret = true;
    if (typeOptions.rows && typeOptions.rows > 1) type = 'textarea';

    if (
      !secret &&
      prop.name &&
      (prop.name.toLowerCase().includes('password') ||
        prop.name.toLowerCase().includes('secret') ||
        prop.name.toLowerCase().includes('apikey') ||
        prop.name.toLowerCase().includes('token') ||
        prop.name.toLowerCase().includes('privatekey'))
    ) {
      secret = true;
    }
  }

  return {
    id: prop.name,
    label: prop.displayName || (prop.name.charAt(0).toUpperCase() + prop.name.slice(1)),
    type: type,
    value: defaultValue !== undefined ? defaultValue : '',
    defaultValue: defaultValue,
    required: !!prop.required,
    placeholder: prop.placeholder,
    helpText: prop.description,
    hint: prop.hint,
    secret: secret,
    options: options,
    n8nDisplayOptions: prop.displayOptions,
    n8nTypeOptions: typeOptions,
    min: typeOptions.minValue,
    max: typeOptions.maxValue,
  };
};

const fallbackValueForField = (field: ConfigField) => {
  switch (field.type) {
    case 'switch': return false;
    case 'number_int': case 'number_dec': return 0;
    case 'select':
      if (field.options && field.options.length) {
        const first = field.options[0];
        return typeof first === 'string' ? first : (first as SelectOption).value;
      }
      return '';
    case 'notice': case 'hidden': return '';
    default: return '';
  }
};

const sanitizeCredentialValues = (fields: ConfigField[], values: Record<string, any>) => {
  const cleaned: Record<string, any> = {};
  fields.forEach((field) => {
    if (field.type === 'hidden' || field.type === 'notice') return;
    if (!isN8nFieldVisible(field, values)) return;
    const val = values[field.id];
    if (val === '' || val === undefined || val === null) return;
    cleaned[field.id] = val;
  });
  return cleaned;
};

export const fetchN8nCredentialSchema = async (credentialType: string): Promise<CredentialSchemaResult> => {
  const { properties, defaults: serverDefaults } = await fetchCredentialProperties(credentialType);
  const fields = properties.map(resolveN8nPropertyToConfigField);
  const values: Record<string, any> = { ...(serverDefaults || {}) };

  fields.forEach((field) => {
    const incoming = values[field.id];
    let initial = incoming !== undefined ? incoming : field.defaultValue;

    if (initial === undefined || initial === null || initial === '') {
      initial = fallbackValueForField(field);
    }

    if (
      (field.type === 'select' || field.type === 'radio') &&
      (initial === undefined || initial === null || initial === '') &&
      field.options && field.options.length > 0
    ) {
      const firstOpt = field.options[0];
      if (typeof firstOpt === 'string') {
        initial = firstOpt;
      } else if (typeof firstOpt === 'object' && firstOpt !== null) {
        initial = (firstOpt as any).value;
      }
    }

    field.value = initial;
    field.defaultValue = initial;
    values[field.id] = initial;
  });

  const payload = sanitizeCredentialValues(fields, values);
  return { fields, defaults: values, payload };
};

export const extractCredentialsFromWorkflow = (workflowJson: any): WorkflowCredential[] => {
  const credentials: WorkflowCredential[] = [];
  const seenIds = new Set<string>();

  if (!workflowJson || !Array.isArray(workflowJson.nodes)) {
    return [];
  }

  workflowJson.nodes.forEach((node: any) => {
    if (node.credentials) {
      Object.keys(node.credentials).forEach((credType) => {
        const credDetails = node.credentials[credType];
        if (credDetails && credDetails.id && !seenIds.has(credDetails.id)) {
          seenIds.add(credDetails.id);
          credentials.push({
            id: credDetails.id,
            name: credDetails.name || 'Sem nome',
            type: credType,
            nodeName: node.name,
            visibleToClient: true,
          });
        }
      });
    }
  });

  return credentials;
};
