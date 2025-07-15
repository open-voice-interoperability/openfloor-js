/**
 * @fileoverview Dialog Event implementation for the Open Floor Protocol
 * Implements the Dialog Event Object Specification Version 1.0.2
 * @author Open Voice Interoperability Initiative
 * @version 0.0.1
 * @license Apache-2.0
 */

import {
    SpanOptions,
    TokenOptions,
    FeatureOptions,
    TextFeatureOptions,
    DialogEventOptions,
    JsonSerializable
  } from './types';
  import {
    parseIsoDuration,
    millisecondsToIsoDuration,
    resolveJsonPath,
    isValidConfidence,
    isValidEncoding,
    createValidationError
  } from './utils';
  
  /**
   * Represents a time span for a dialog event or token according to the Open Floor specification.
   * Time spans can be absolute (using Date objects) or relative (using duration offsets).
   * 
   * @example
   * ```typescript
   * // Absolute time span
   * const span1 = new Span({ startTime: new Date(), endTime: new Date(Date.now() + 5000) });
   * 
   * // Relative time span
   * const span2 = new Span({ startOffset: 1000, endOffset: 5000 });
   * ```
   */
  export class Span implements JsonSerializable {
    readonly startTime?: Date;
    readonly startOffset?: number;
    readonly endTime?: Date;
    readonly endOffset?: number;
  
    /**
     * Creates a new Span instance
     * @param options - Span configuration options
     * @throws Error if invalid combination of time parameters is provided
     */
    constructor(options: SpanOptions = {}) {
      const { startTime, startOffset, endTime, endOffset } = options;
      
      if (!startTime && startOffset === undefined) {
        this.startTime = new Date();
      } else {
        if (startTime !== undefined) this.startTime = startTime;
        if (startOffset !== undefined) this.startOffset = startOffset;
      }
      
      if (endTime !== undefined) this.endTime = endTime;
      if (endOffset !== undefined) this.endOffset = endOffset;
      
      if (this.startTime && this.startOffset !== undefined) {
        throw new Error(createValidationError(
          'Span', 
          'both startTime and startOffset', 
          'either startTime or startOffset, not both'
        ));
      }
      
      if (this.endTime && this.endOffset !== undefined) {
        throw new Error(createValidationError(
          'Span', 
          'both endTime and endOffset', 
          'either endTime or endOffset, not both'
        ));
      }
      
      if (!this.startTime && this.startOffset === undefined) {
        throw new Error(createValidationError(
          'Span', 
          'neither startTime nor startOffset', 
          'either startTime or startOffset'
        ));
      }
    }
  
    /**
     * Convert to plain object for JSON serialization
     */
    toObject(): Record<string, unknown> {
      const result: Record<string, unknown> = {};
      
      if (this.startTime) {
        result.startTime = this.startTime.toISOString();
      }
      if (this.startOffset !== undefined) {
        result.startOffset = millisecondsToIsoDuration(this.startOffset);
      }
      if (this.endTime) {
        result.endTime = this.endTime.toISOString();
      }
      if (this.endOffset !== undefined) {
        result.endOffset = millisecondsToIsoDuration(this.endOffset);
      }
      
      return result;
    }
  
    /**
     * Convert to JSON string
     */
    toJSON(): string {
      return JSON.stringify(this.toObject());
    }
  
    /**
     * Creates a Span instance from a dictionary with automatic type conversion
     */
    static fromObject(data: Record<string, unknown>): Span {
      const options: SpanOptions = {};
      
      if (typeof data.startTime === 'string') {
        options.startTime = new Date(data.startTime);
      } else if (data.startTime instanceof Date) {
        options.startTime = data.startTime;
      }
      
      if (typeof data.endTime === 'string') {
        options.endTime = new Date(data.endTime);
      } else if (data.endTime instanceof Date) {
        options.endTime = data.endTime;
      }
      
      if (typeof data.startOffset === 'string') {
        options.startOffset = parseIsoDuration(data.startOffset);
      } else if (typeof data.startOffset === 'number') {
        options.startOffset = data.startOffset;
      }
      
      if (typeof data.endOffset === 'string') {
        options.endOffset = parseIsoDuration(data.endOffset);
      } else if (typeof data.endOffset === 'number') {
        options.endOffset = data.endOffset;
      }
      
      return new Span(options);
    }
  }
  
  /**
   * Represents a single token in a dialog event feature with optional metadata.
   * Tokens are the fundamental units of information within features.
   * 
   * @example
   * ```typescript
   * // Simple text token
   * const token1 = new Token({ value: "Hello world" });
   * 
   * // Token with confidence and span
   * const token2 = new Token({
   *   value: "Hello",
   *   confidence: 0.95,
   *   span: { startOffset: 0, endOffset: 1000 }
   * });
   * 
   * // Token with links to other features
   * const token3 = new Token({
   *   value: { intent: "greeting" },
   *   links: ["$.textFeature.tokens[0].value"]
   * });
   * ```
   */
  export class Token implements JsonSerializable {
    readonly value?: unknown;
    readonly valueUrl?: string;
    readonly span?: Span;
    readonly confidence?: number;
    readonly links: readonly string[];
  
    /**
     * Creates a new Token instance
     * @param options - Token configuration options
     * @throws Error if invalid configuration is provided
     */
    constructor(options: TokenOptions = {}) {
      const { value, valueUrl, span, confidence, links = [] } = options;
      this.value = value;
      if (valueUrl !== undefined) this.valueUrl = valueUrl;
      if (span !== undefined) this.span = new Span(span);
      if (confidence !== undefined) this.confidence = confidence;
      this.links = Object.freeze([...links]);
      
      if (this.value === undefined && !this.valueUrl) {
        throw new Error(createValidationError(
          'Token', 
          'neither value nor valueUrl', 
          'either value or valueUrl'
        ));
      }
      
      if (this.value !== undefined && this.valueUrl) {
        throw new Error(createValidationError(
          'Token', 
          'both value and valueUrl', 
          'either value or valueUrl, not both'
        ));
      }
      
      if (this.confidence !== undefined && !isValidConfidence(this.confidence)) {
        throw new Error(createValidationError(
          'Token.confidence', 
          this.confidence, 
          'number between 0 and 1'
        ));
      }
    }
  
    /**
     * Convert to plain object for JSON serialization
     */
    toObject(): Record<string, unknown> {
      const result: Record<string, unknown> = {};
      
      if (this.value !== undefined) {
        result.value = this.value;
      }
      if (this.valueUrl) {
        result.valueUrl = this.valueUrl;
      }
      if (this.span) {
        result.span = this.span.toObject();
      }
      if (this.confidence !== undefined) {
        result.confidence = this.confidence;
      }
      if (this.links.length > 0) {
        result.links = [...this.links];
      }
      
      return result;
    }
  
    /**
     * Convert to JSON string
     */
    toJSON(): string {
      return JSON.stringify(this.toObject());
    }
  
    /**
     * Creates a Token instance from a dictionary with nested object conversion
     */
    static fromObject(data: Record<string, unknown>): Token {
      const options: TokenOptions = { ...data };
      
      if (data.span && typeof data.span === 'object') {
        options.span = Span.fromObject(data.span as Record<string, unknown>).toObject() as SpanOptions;
      }
      
      return new Token(options);
    }
  
    /**
     * Resolves JSON Path links within a dialog event to find linked values
     * @param dialogEvent - The parent dialog event to search within
     * @returns Array of [path, value] pairs for matched links
     */
    getLinkedValues(dialogEvent: DialogEvent): Array<[string, unknown]> {
      const values: Array<[string, unknown]> = [];
      const featuresDict = Object.fromEntries(
        Object.entries(dialogEvent.features).map(([key, feature]) => [key, feature.toObject()])
      );
      
      for (const linkPath of this.links) {
        try {
          const results = resolveJsonPath(linkPath, featuresDict);
          for (const result of results) {
            values.push([linkPath, result]);
          }
        } catch (error) {
          console.warn(`Failed to resolve JSON path "${linkPath}":`, error);
        }
      }
      
      return values;
    }
  }
  
  /**
   * Represents a feature in a dialog event according to the Open Floor specification.
   * Features contain tokens and metadata about different aspects of the dialog event.
   * 
   * @example
   * ```typescript
   * // Text feature with multiple tokens
   * const feature = new Feature({
   *   mimeType: 'text/plain',
   *   tokens: [
   *     { value: 'Hello' },
   *     { value: 'world' }
   *   ]
   * });
   * 
   * // Feature with alternatives and language
   * const feature2 = new Feature({
   *   mimeType: 'text/plain',
   *   lang: 'en-US',
   *   tokens: [{ value: 'Hello', confidence: 0.95 }],
   *   alternates: [[{ value: 'Hi', confidence: 0.85 }]]
   * });
   * ```
   */
  export class Feature implements JsonSerializable {
    readonly mimeType: string;
    readonly tokens: readonly Token[];
    readonly alternates: readonly (readonly Token[])[];
    readonly lang?: string;
    readonly encoding?: string;
    readonly tokenSchema?: string;
  
    /**
     * Creates a new Feature instance
     * @param options - Feature configuration options
     * @throws Error if invalid configuration is provided
     */
    constructor(options: FeatureOptions) {
      const { mimeType, tokens, alternates = [], lang, encoding, tokenSchema } = options;
      if (!mimeType) throw new Error('Feature.mimeType is required');
      if (!tokens) throw new Error('Feature.tokens is required');
      this.mimeType = mimeType;
      this.tokens = Object.freeze(tokens.map(token => new Token(token)));
      this.alternates = Object.freeze(alternates.map(arr => Object.freeze(arr.map(token => new Token(token)))));
      if (lang !== undefined) this.lang = lang;
      if (encoding !== undefined) this.encoding = encoding;
      if (tokenSchema !== undefined) this.tokenSchema = tokenSchema;
      
      if (encoding && !isValidEncoding(encoding)) {
        throw new Error(createValidationError(
          'Feature.encoding', 
          encoding, 
          '"ISO-8859-1", "iso-8859-1", "UTF-8", or "utf-8"'
        ));
      }
    }
  
    /**
     * Convert to plain object for JSON serialization
     */
    toObject(): Record<string, unknown> {
      const result: Record<string, unknown> = {
        mimeType: this.mimeType,
        tokens: this.tokens.map(token => token.toObject())
      };
      
      if (this.alternates.length > 0) {
        result.alternates = this.alternates.map(alt => alt.map(token => token.toObject()));
      }
      if (this.lang) {
        result.lang = this.lang;
      }
      if (this.encoding) {
        result.encoding = this.encoding;
      }
      if (this.tokenSchema) {
        result.tokenSchema = this.tokenSchema;
      }
      
      return result;
    }
  
    /**
     * Convert to JSON string
     */
    toJSON(): string {
      return JSON.stringify(this.toObject());
    }
  
    /**
     * Creates a Feature instance from a dictionary with nested object conversion
     */
    static fromObject(data: Record<string, unknown>): Feature {
      const options: FeatureOptions = {
        mimeType: data.mimeType as string,
        tokens: Array.isArray(data.tokens)
          ? data.tokens.map(t => Token.fromObject(t as Record<string, unknown>).toObject() as TokenOptions)
          : [],
        ...(data.alternates !== undefined ? { alternates: (data.alternates as unknown[]).map(
          (alt: unknown) => (Array.isArray(alt)
            ? alt.map(tokenData => Token.fromObject(tokenData as Record<string, unknown>).toObject() as TokenOptions)
            : [])
        ) } : {}),
        ...(data.lang !== undefined ? { lang: data.lang as string } : {}),
        ...(data.encoding !== undefined ? { encoding: data.encoding as string } : {}),
        ...(data.tokenSchema !== undefined ? { tokenSchema: data.tokenSchema as string } : {})
      };
      return new Feature(options);
    }
  }
  
  /**
   * Specialized text feature with convenient string value handling.
   * Automatically sets mimeType to 'text/plain' and provides a values convenience property.
   * 
   * @example
   * ```typescript
   * // Create from string values
   * const textFeature = new TextFeature({ values: ['Hello', 'world'] });
   * 
   * // Create with full token options
   * const textFeature2 = new TextFeature({
   *   tokens: [{ value: 'Hello', confidence: 0.95 }],
   *   lang: 'en-US'
   * });
   * ```
   */
  export class TextFeature extends Feature {
    /**
     * Creates a new TextFeature instance
     * @param options - TextFeature configuration options
     */
    constructor(options: TextFeatureOptions = {}) {
      const { values, mimeType = 'text/plain', ...rest } = options;
      
      // If values provided, convert to tokens
      const tokens = values 
        ? values.map(value => ({ value }))
        : rest.tokens || [];
      
      super({
        mimeType,
        tokens,
        ...rest
      });
    }
  }
  
  /**
   * Represents a dialog event according to the Open Floor specification.
   * Dialog events capture linguistic events with features, timing, and speaker information.
   * 
   * @example
   * ```typescript
   * // Simple text dialog event
   * const event = new DialogEvent({
   *   speakerUri: 'tag:example.com,2025:user1',
   *   features: {
   *     text: { mimeType: 'text/plain', tokens: [{ value: 'Hello world' }] }
   *   }
   * });
   * 
   * // Dialog event with timing and context
   * const event2 = new DialogEvent({
   *   speakerUri: 'tag:example.com,2025:agent1',
   *   span: { startTime: new Date() },
   *   features: {
   *     text: { mimeType: 'text/plain', tokens: [{ value: 'How can I help?' }] }
   *   },
   *   context: 'Greeting response'
   * });
   * ```
   */
  export class DialogEvent implements JsonSerializable {
    readonly id: string;
    readonly speakerUri: string;
    readonly span: Span;
    readonly features: ReadonlyMap<string, Feature>;
    readonly previousId?: string;
    readonly context?: string;
  
    /**
     * Creates a new DialogEvent instance
     * @param options - DialogEvent configuration options
     * @throws Error if required parameters are missing
     */
    constructor(options: DialogEventOptions) {
      const { id, speakerUri, span, features, previousId, context } = options;
      if (!id) throw new Error('DialogEvent.id is required');
      if (!speakerUri) throw new Error('DialogEvent.speakerUri is required');
      if (!span) throw new Error('DialogEvent.span is required');
      if (!features) throw new Error('DialogEvent.features is required');
      this.id = id;
      this.speakerUri = speakerUri;
      this.span = new Span(span);
      this.features = new Map(Object.entries(features).map(([k, v]) => [k, new Feature(v as FeatureOptions)]));
      if (previousId !== undefined) this.previousId = previousId;
      if (context !== undefined) this.context = context;
    }
  
    /**
     * Convert to plain object for JSON serialization
     */
    toObject(): Record<string, unknown> {
      const result: Record<string, unknown> = {
        id: this.id,
        speakerUri: this.speakerUri,
        span: this.span.toObject(),
        features: Object.fromEntries(
          Array.from(this.features.entries()).map(([name, feature]) => [name, feature.toObject()])
        )
      };
      
      if (this.previousId) {
        result.previousId = this.previousId;
      }
      if (this.context) {
        result.context = this.context;
      }
      
      return result;
    }
  
    /**
     * Convert to JSON string
     */
    toJSON(): string {
      return JSON.stringify(this.toObject());
    }
  
    /**
     * Creates a DialogEvent instance from a dictionary with nested object conversion
     */
    static fromObject(data: Record<string, unknown>): DialogEvent {
      const options: DialogEventOptions = {
        speakerUri: data.speakerUri as string,
        span: Span.fromObject(data.span as Record<string, unknown>),
        features: Object.fromEntries(
          Object.entries(data.features as Record<string, unknown>)
            .filter(([_, v]) => {
              if (!v || typeof v !== 'object') return false;
              const rec = v as Record<string, unknown>;
              return typeof rec.mimeType === 'string';
            })
            .map(([k, v]) => [k, Feature.fromObject(v as unknown as Record<string, unknown>).toObject() as unknown as FeatureOptions])
        ),
        ...(data.id !== undefined ? { id: data.id as string } : {}),
        ...(data.previousId !== undefined ? { previousId: data.previousId as string } : {}),
        ...(data.context !== undefined ? { context: data.context as string } : {})
      };
      return new DialogEvent(options);
    }
  }
  
  /**
   * Type alias for an array of DialogEvent instances representing conversation history
   */
  export type DialogHistory = DialogEvent[];