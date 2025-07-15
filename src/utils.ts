/**
 * @fileoverview Utility functions for the Open Floor Protocol
 * @author Open Voice Interoperability Initiative
 * @version 0.0.1
 * @license Apache-2.0
 */

/**
 * Parses an ISO 8601 duration string and returns the number of milliseconds
 * Supports the format: P[n]D[T[n]H[n]M[n]S]
 * 
 * @param duration - ISO 8601 duration string (e.g., "PT3H30M15S")
 * @returns Duration in milliseconds
 * @throws Error if the duration string is invalid
 * 
 * @example
 * ```typescript
 * parseIsoDuration("PT1H30M"); // Returns 5400000 (1.5 hours in ms)
 * parseIsoDuration("P1DT2H"); // Returns 93600000 (26 hours in ms)
 * ```
 */
export function parseIsoDuration(duration: string): number {
    const regex = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/;
    const matches = duration.match(regex);
    
    if (!matches) {
      throw new Error(`Invalid ISO 8601 duration: ${duration}`);
    }
    
    const days = parseInt(matches[1] || '0', 10);
    const hours = parseInt(matches[2] || '0', 10);
    const minutes = parseInt(matches[3] || '0', 10);
    const seconds = parseFloat(matches[4] || '0');
    
    return ((days * 24 + hours) * 60 + minutes) * 60000 + seconds * 1000;
  }
  
  /**
   * Converts milliseconds to ISO 8601 duration format
   * 
   * @param milliseconds - Duration in milliseconds
   * @returns ISO 8601 duration string
   * 
   * @example
   * ```typescript
   * millisecondsToIsoDuration(5400000); // Returns "PT1H30M"
   * millisecondsToIsoDuration(90000); // Returns "PT1M30S"
   * ```
   */
  export function millisecondsToIsoDuration(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}H`);
    if (minutes > 0) parts.push(`${minutes}M`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}S`);
    
    return `PT${parts.join('')}`;
  }
  
  /**
   * Generates a UUID v4 string using the available crypto API
   * Falls back to a simple implementation if crypto.randomUUID is not available
   * 
   * @returns A UUID v4 string
   * 
   * @example
   * ```typescript
   * const id = generateUUID(); // "f47ac10b-58cc-4372-a567-0e02b2c3d479"
   * ```
   */
  export function generateUUID(): string {
    // Use native crypto.randomUUID if available (Node 16.7+ / modern browsers)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    
    // Fallback implementation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  /**
   * Resolves JSON Path expressions with support for the substring() extension
   * 
   * @param path - JSON Path expression (e.g., "$.features.text.tokens[0].value")
   * @param data - Object to query
   * @returns Array of matched values
   * 
   * @example
   * ```typescript
   * const data = { features: { text: { tokens: [{ value: "hello world" }] } } };
   * resolveJsonPath("$.features.text.tokens[0].value", data); // ["hello world"]
   * resolveJsonPath("$.features.text.tokens[0].value.substring(0,5)", data); // ["hello"]
   * ```
   */
  export function resolveJsonPath(path: string, data: unknown): unknown[] {
    // Check for substring() extension
    const substringMatch = path.match(/^(.+)\.substring\((\d+),(\d+)\)$/);
    
    if (substringMatch) {
      const [, basePath, startStr, endStr] = substringMatch;
      if (startStr === undefined || endStr === undefined || basePath === undefined) {
        return [];
      }
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      
      const baseResults = resolveBasicJsonPath(basePath, data);
      return baseResults
        .filter((result): result is string => typeof result === 'string')
        .map(str => str.substring(start, end));
    }
    
    return resolveBasicJsonPath(path, data);
  }
  
  /**
   * Basic JSON Path resolution without extensions
   * Supports: $, ., [], array indexing, property access
   * 
   * @param path - JSON Path expression
   * @param data - Object to query
   * @returns Array of matched values
   */
  function resolveBasicJsonPath(path: string, data: unknown): unknown[] {
    if (!path.startsWith('$')) {
      throw new Error('JSON Path must start with $');
    }
    
    const parts = path.slice(1).split(/[.\[]/).filter(Boolean);
    let current: unknown = data;
    
    for (const part of parts) {
      if (part.endsWith(']')) {
        // Array index access
        const index = parseInt(part.slice(0, -1), 10);
        if (Array.isArray(current)) {
          current = current[index];
        } else {
          return [];
        }
      } else {
        // Property access
        if (current && typeof current === 'object' && part in current) {
          current = (current as Record<string, unknown>)[part];
        } else {
          return [];
        }
      }
      
      if (current === undefined) {
        return [];
      }
    }
    
    return [current];
  }
  
  /**
   * Validates that a string is a properly formatted URI
   * 
   * @param uri - String to validate
   * @returns True if the string is a valid URI format
   * 
   * @example
   * ```typescript
   * isValidUri("tag:example.com,2025:agent1"); // true
   * isValidUri("https://example.com/agent"); // true
   * isValidUri("not-a-uri"); // false
   * ```
   */
  export function isValidUri(uri: string): boolean {
    try {
      // Basic URI validation - must have scheme:path format
      const colonIndex = uri.indexOf(':');
      if (colonIndex === -1 || colonIndex === 0) {
        return false;
      }
      
      const scheme = uri.substring(0, colonIndex);
      const path = uri.substring(colonIndex + 1);
      
      // Scheme must be alphanumeric + some special chars
      if (!/^[a-zA-Z][a-zA-Z0-9+.-]*$/.test(scheme)) {
        return false;
      }
      
      // Path must not be empty
      if (!path) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Validates that a string is a properly formatted URL
   * 
   * @param url - String to validate
   * @returns True if the string is a valid URL
   * 
   * @example
   * ```typescript
   * isValidUrl("https://example.com/api"); // true
   * isValidUrl("http://localhost:3000"); // true
   * isValidUrl("not-a-url"); // false
   * ```
   */
  export function isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Validates that a confidence value is within the valid range (0.0 to 1.0)
   * 
   * @param confidence - Confidence value to validate
   * @returns True if the confidence is valid
   * 
   * @example
   * ```typescript
   * isValidConfidence(0.95); // true
   * isValidConfidence(1.0); // true
   * isValidConfidence(1.5); // false
   * ```
   */
  export function isValidConfidence(confidence: number): boolean {
    return typeof confidence === 'number' && 
           confidence >= 0 && 
           confidence <= 1 && 
           !Number.isNaN(confidence);
  }
  
  /**
   * Validates encoding string against allowed values
   * 
   * @param encoding - Encoding string to validate
   * @returns True if encoding is valid
   */
  export function isValidEncoding(encoding: string): boolean {
    const validEncodings = ['ISO-8859-1', 'iso-8859-1', 'UTF-8', 'utf-8'];
    return validEncodings.includes(encoding);
  }
  
  /**
   * Deep clones an object using structuredClone if available, otherwise JSON fallback
   * 
   * @param obj - Object to clone
   * @returns Deep clone of the object
   */
  export function deepClone<T>(obj: T): T {
    if (typeof structuredClone !== 'undefined') {
      return structuredClone(obj);
    }
    
    // Fallback for environments without structuredClone
    return JSON.parse(JSON.stringify(obj));
  }
  
  /**
   * Checks if an object has all required properties
   * 
   * @param obj - Object to check
   * @param requiredProps - Array of required property names
   * @returns True if all required properties are present and not undefined
   */
  export function hasRequiredProperties(
    obj: unknown, 
    requiredProps: string[]
  ): obj is Record<string, unknown> {
    if (!obj || typeof obj !== 'object') {
      return false;
    }
    
    const record = obj as Record<string, unknown>;
    return requiredProps.every(prop => 
      prop in record && record[prop] !== undefined
    );
  }
  
  /**
   * Creates a standardized error message for validation failures
   * 
   * @param fieldName - Name of the field that failed validation
   * @param value - The invalid value
   * @param requirement - Description of what was required
   * @returns Formatted error message
   */
  export function createValidationError(
    fieldName: string, 
    value: unknown, 
    requirement: string
  ): string {
    return `${fieldName}: expected ${requirement}, got ${typeof value === 'string' ? `"${value}"` : typeof value}`;
  }