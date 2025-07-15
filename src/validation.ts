/**
 * @fileoverview JSON Schema validation for Open Floor Protocol
 * Provides validation against the official Open Floor schemas
 * @author Open Voice Interoperability Initiative
 * @version 0.0.1
 * @license Apache-2.0
 */

import { ValidationResult } from './types';
import conversationEnvelopeSchema from '../schemas/conversation-envelope/1.0.0/conversation-envelope-schema.json';
import dialogEventSchema from '../schemas/dialog-event/1.0.2/dialog-event-schema.json';
import assistantManifestSchema from '../schemas/assistant-manifest/1.0.0/assistant-manifest-schema.json';

/**
 * Simple JSON Schema validator implementation
 * Provides basic validation without external dependencies
 */
class SimpleValidator {
  /**
   * Validate data against a JSON schema
   * @param data - Data to validate
   * @param schema - JSON schema to validate against
   * @returns Validation result
   */
  static validate(data: unknown, schema: Record<string, any>): ValidationResult {
    const errors: string[] = [];
    
    try {
      this._validateObject(data, schema, '', errors);
    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Recursively validate an object against a schema
   */
  private static _validateObject(
    data: unknown, 
    schema: Record<string, any>, 
    path: string, 
    errors: string[]
  ): void {
    // Type validation
    if (schema.type) {
      if (schema.type === 'array') {
        if (!Array.isArray(data)) {
          errors.push(`${path || 'root'}: expected array, got ${typeof data}`);
          return;
        }
      } else if (typeof data !== schema.type) {
        if (!(schema.type === 'object' && data && typeof data === 'object')) {
          errors.push(`${path || 'root'}: expected ${schema.type}, got ${typeof data}`);
          return;
        }
      }
    }

    // Required properties validation
    if (schema.required && Array.isArray(schema.required) && data && typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      for (const requiredProp of schema.required) {
        if (!(requiredProp in obj) || obj[requiredProp] === undefined) {
          errors.push(`${path || 'root'}: missing required property '${requiredProp}'`);
        }
      }
    }

    // Properties validation
    if (schema.properties && data && typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        if (propName in obj) {
          const propPath = path ? `${path}.${propName}` : propName;
          this._validateObject(obj[propName], propSchema as Record<string, any>, propPath, errors);
        }
      }
    }

    // Pattern properties validation
    if (schema.patternProperties && data && typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      for (const [pattern, propSchema] of Object.entries(schema.patternProperties)) {
        const regex = new RegExp(pattern);
        for (const [propName, propValue] of Object.entries(obj)) {
          if (regex.test(propName)) {
            const propPath = path ? `${path}.${propName}` : propName;
            this._validateObject(propValue, propSchema as Record<string, any>, propPath, errors);
          }
        }
      }
    }

    // Array validation
    if (schema.items && Array.isArray(data)) {
      data.forEach((item, index) => {
        const itemPath = `${path}[${index}]`;
        this._validateObject(item, schema.items as Record<string, any>, itemPath, errors);
      });
    }

    // Enum validation
    if (schema.enum && Array.isArray(schema.enum)) {
      if (!schema.enum.includes(data)) {
        errors.push(`${path || 'root'}: value must be one of [${schema.enum.join(', ')}], got ${JSON.stringify(data)}`);
      }
    }

    // Number range validation
    if (typeof data === 'number') {
      if (typeof schema.minimum === 'number' && data < schema.minimum) {
        errors.push(`${path || 'root'}: value ${data} is below minimum ${schema.minimum}`);
      }
      if (typeof schema.maximum === 'number' && data > schema.maximum) {
        errors.push(`${path || 'root'}: value ${data} is above maximum ${schema.maximum}`);
      }
    }

    // String pattern validation
    if (typeof data === 'string' && schema.pattern) {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(data)) {
        errors.push(`${path || 'root'}: string does not match pattern ${schema.pattern}`);
      }
    }

    // AnyOf validation
    if (schema.anyOf && Array.isArray(schema.anyOf)) {
      const anyOfErrors: string[] = [];
      let valid = false;
      
      for (const subSchema of schema.anyOf) {
        const subErrors: string[] = [];
        this._validateObject(data, subSchema as Record<string, any>, path, subErrors);
        if (subErrors.length === 0) {
          valid = true;
          break;
        }
        anyOfErrors.push(...subErrors);
      }
      
      if (!valid) {
        errors.push(`${path || 'root'}: value does not match any of the allowed schemas`);
      }
    }
  }
}

/**
 * Validates a dialog event object against the Dialog Event schema
 * @param data - Dialog event data to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const dialogEvent = {
 *   id: 'de:123',
 *   speakerUri: 'tag:example.com,2025:user1',
 *   span: { startTime: '2025-01-01T00:00:00Z' },
 *   features: {
 *     text: {
 *       mimeType: 'text/plain',
 *       tokens: [{ value: 'Hello' }]
 *     }
 *   }
 * };
 * 
 * const result = validateDialogEvent(dialogEvent);
 * console.log(result.valid); // true or false
 * ```
 */
export function validateDialogEvent(data: unknown): ValidationResult {
  return SimpleValidator.validate(data, dialogEventSchema);
}

/**
 * Validates an assistant manifest object against the Assistant Manifest schema
 * @param data - Manifest data to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const manifest = {
 *   identification: {
 *     speakerUri: 'tag:example.com,2025:bot1',
 *     serviceUrl: 'https://example.com/bot',
 *     organization: 'Example Corp',
 *     conversationalName: 'Bot',
 *     synopsis: 'A helpful assistant'
 *   },
 *   capabilities: []
 * };
 * 
 * const result = validateManifest(manifest);
 * console.log(result.valid); // true or false
 * ```
 */
export function validateManifest(data: unknown): ValidationResult {
  return SimpleValidator.validate(data, assistantManifestSchema);
}

/**
 * Validates a conversation envelope object against the Conversation Envelope schema
 * @param data - Envelope data to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const envelope = {
 *   openFloor: {
 *     schema: { version: '1.0.0' },
 *     conversation: { id: 'conv:123' },
 *     sender: { speakerUri: 'tag:example.com,2025:agent1' },
 *     events: []
 *   }
 * };
 * 
 * const result = validateEnvelope(envelope);
 * console.log(result.valid); // true or false
 * ```
 */
export function validateEnvelope(data: unknown): ValidationResult {
  return SimpleValidator.validate(data, conversationEnvelopeSchema);
}

/**
 * Enhanced validator that uses external AJV library if available
 * Falls back to simple validator if AJV is not available
 */
export class EnhancedValidator {
  private static _ajv: any = null;
  private static _initialized = false;

  /**
   * Initialize the validator (attempts to load AJV)
   */
  private static _initialize(): void {
    if (this._initialized) return;
    
    try {
      const Ajv = require('ajv');
      this._ajv = new Ajv({ 
        allErrors: true,
        verbose: true,
        strict: false 
      });
    } catch {
      this._ajv = null;
    }
    
    this._initialized = true;
  }

  /**
   * Validate data against schema using AJV if available, otherwise simple validator
   * @param data - Data to validate
   * @param schema - JSON schema
   * @returns Validation result
   */
  static validate(data: unknown, schema: Record<string, any>): ValidationResult {
    this._initialize();

    if (this._ajv) {
      try {
        const validate = this._ajv.compile(schema);
        const valid = validate(data);
        
        return {
          valid,
          errors: valid ? [] : (validate.errors || []).map((err: any) => 
            `${err.instancePath || 'root'}: ${err.message}`
          )
        };
      } catch (error) {
        return SimpleValidator.validate(data, schema);
      }
    }

    return SimpleValidator.validate(data, schema);
  }
}

/**
 * Validates dialog event using enhanced validator
 */
export function validateDialogEventEnhanced(data: unknown): ValidationResult {
  return EnhancedValidator.validate(data, dialogEventSchema);
}

/**
 * Validates manifest using enhanced validator
 */
export function validateManifestEnhanced(data: unknown): ValidationResult {
  return EnhancedValidator.validate(data, assistantManifestSchema);
}

/**
 * Validates envelope using enhanced validator
 */
export function validateEnvelopeEnhanced(data: unknown): ValidationResult {
  return EnhancedValidator.validate(data, conversationEnvelopeSchema);
}