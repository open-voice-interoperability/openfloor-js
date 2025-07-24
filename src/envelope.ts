/**
 * @fileoverview Envelope and Manifest implementation for the Open Floor Protocol
 * Implements the Inter-Agent Message Specification v1.0.0 and Assistant Manifest Specification v1.0.0
 * @author Open Voice Interoperability Initiative
 * @version 0.0.1
 * @license Apache-2.0
 */

import {
    SchemaOptions,
    IdentificationOptions,
    SupportedLayersOptions,
    CapabilityOptions,
    ManifestOptions,
    ConversantOptions,
    ConversationOptions,
    SenderOptions,
    ToOptions,
    BaseEventOptions,
    EnvelopeOptions,
    PayloadOptions,
    JsonSerializable,
    EventType
  } from './types';
  import {
    isValidUri,
    createValidationError,
    hasRequiredProperties
  } from './utils';
  
  /**
   * Represents schema information for Open Floor protocol messages
   * 
   * @example
   * ```typescript
   * const schema = new Schema({ version: '1.0.0' });
   * const schemaWithUrl = new Schema({ 
   *   version: '1.0.0', 
   *   url: 'https://example.com/schema.json' 
   * });
   * ```
   */
  export class Schema implements JsonSerializable {
    readonly version: string;
    readonly url?: string;
  
    /**
     * Creates a new Schema instance
     * @param options - Schema configuration options
     */
    constructor(options: SchemaOptions) {
      this.version = options.version;
      if (options.url !== undefined) this.url = options.url;
    }
  
    toObject(): Record<string, unknown> {
      const result: Record<string, unknown> = { version: this.version };
      if (this.url) {
        result.url = this.url;
      }
      return result;
    }
  
    toJSON(): string {
      return JSON.stringify(this.toObject());
    }
  
    static fromObject(data: Record<string, unknown>): Schema {
      if (!hasRequiredProperties(data, ['version'])) {
        throw new Error('Schema requires version');
      }
      return new Schema({
        version: data.version as string,
        ...(data.url !== undefined ? { url: data.url as string } : {})
      });
    }
  }
  
  /**
   * Represents identification information for an agent or conversant
   * 
   * @example
   * ```typescript
   * const identification = new Identification({
   *   speakerUri: 'tag:example.com,2025:agent1',
   *   serviceUrl: 'https://example.com/agent',
   *   organization: 'Example Corp',
   *   conversationalName: 'Assistant',
   *   synopsis: 'Helpful AI assistant'
   * });
   * ```
   */
  export class Identification implements JsonSerializable {
    readonly speakerUri: string;
    readonly serviceUrl: string;
    readonly organization?: string;
    readonly conversationalName?: string;
    readonly department?: string;
    readonly role?: string;
    readonly synopsis?: string;
  
    /**
     * Creates a new Identification instance
     * @param options - Identification configuration options
     * @throws Error if required fields are missing or invalid
     */
    constructor(options: IdentificationOptions) {
      const { speakerUri, serviceUrl, organization, conversationalName, synopsis, department, role } = options;
      if (!speakerUri) throw new Error(createValidationError('Identification.speakerUri', speakerUri, 'non-empty string'));
      if (!serviceUrl) throw new Error(createValidationError('Identification.serviceUrl', serviceUrl, 'non-empty string'));
      if (!organization) throw new Error(createValidationError('Identification.organization', organization, 'non-empty string'));
      if (!conversationalName) throw new Error(createValidationError('Identification.conversationalName', conversationalName, 'non-empty string'));
      if (!synopsis) throw new Error(createValidationError('Identification.synopsis', synopsis, 'non-empty string'));
      this.speakerUri = speakerUri;
      this.serviceUrl = serviceUrl;
      this.organization = organization;
      this.conversationalName = conversationalName;
      this.synopsis = synopsis;
      if (department) this.department = department;
      if (role) this.role = role;
    }
  
    toObject(): Record<string, unknown> {
      const result: Record<string, unknown> = {
        speakerUri: this.speakerUri,
        serviceUrl: this.serviceUrl
      };
  
      if (this.organization) result.organization = this.organization;
      if (this.conversationalName) result.conversationalName = this.conversationalName;
      if (this.department) result.department = this.department;
      if (this.role) result.role = this.role;
      if (this.synopsis) result.synopsis = this.synopsis;
  
      return result;
    }
  
    toJSON(): string {
      return JSON.stringify(this.toObject());
    }
  
    static fromObject(data: Record<string, unknown>): Identification {
      if (!hasRequiredProperties(data, ['speakerUri', 'serviceUrl', 'organization', 'conversationalName', 'synopsis'])) {
        throw new Error('Identification requires speakerUri, serviceUrl, organization, conversationalName, and synopsis');
      }
      return new Identification({
        speakerUri: data.speakerUri as string,
        serviceUrl: data.serviceUrl as string,
        organization: data.organization as string,
        conversationalName: data.conversationalName as string,
        synopsis: data.synopsis as string,
        ...(data.department !== undefined ? { department: data.department as string } : {}),
        ...(data.role !== undefined ? { role: data.role as string } : {})
      });
    }
  }
  
  /**
   * Represents supported input/output layers for agent capabilities
   * 
   * @example
   * ```typescript
   * const layers = new SupportedLayers({
   *   input: ['text', 'audio'],
   *   output: ['text', 'ssml', 'audio']
   * });
   * ```
   */
  export class SupportedLayers implements JsonSerializable {
    readonly input: readonly string[];
    readonly output: readonly string[];
  
    /**
     * Creates a new SupportedLayers instance
     * @param options - SupportedLayers configuration options
     */
    constructor(options: SupportedLayersOptions = {}) {
      this.input = Object.freeze(options.input || ['text']);
      this.output = Object.freeze(options.output || ['text']);
    }
  
    toObject(): Record<string, unknown> {
      return {
        input: [...this.input],
        output: [...this.output]
      };
    }
  
    toJSON(): string {
      return JSON.stringify(this.toObject());
    }
  
    static fromObject(data: Record<string, unknown>): SupportedLayers {
      return new SupportedLayers({
        input: data.input as string[],
        output: data.output as string[]
      });
    }
  }
  
  /**
   * Represents a single capability of an agent
   * 
   * @example
   * ```typescript
   * const capability = new Capability({
   *   keyphrases: ['weather', 'forecast', 'temperature'],
   *   descriptions: ['Provides weather information and forecasts'],
   *   languages: ['en-US', 'en-GB'],
   *   supportedLayers: { input: ['text'], output: ['text', 'ssml'] }
   * });
   * ```
   */
  export class Capability implements JsonSerializable {
    readonly keyphrases: readonly string[];
    readonly descriptions: readonly string[];
    readonly languages?: readonly string[];
    readonly supportedLayers: SupportedLayers;
  
    /**
     * Creates a new Capability instance
     * @param options - Capability configuration options
     * @throws Error if required fields are missing
     */
    constructor(options: CapabilityOptions) {
      const { keyphrases, descriptions, languages, supportedLayers } = options;
  
      if (!keyphrases || keyphrases.length === 0) throw new Error(createValidationError('Capability.keyphrases', keyphrases, 'non-empty array of strings'));
  
      if (!descriptions || descriptions.length === 0) throw new Error(createValidationError('Capability.descriptions', descriptions, 'non-empty array of strings'));
  
      this.keyphrases = Object.freeze([...keyphrases]);
      this.descriptions = Object.freeze([...descriptions]);
      if (languages) this.languages = Object.freeze([...languages]);
      if (supportedLayers) this.supportedLayers = new SupportedLayers(supportedLayers);
      else this.supportedLayers = new SupportedLayers({});
    }
  
    toObject(): Record<string, unknown> {
      const result: Record<string, unknown> = {
        keyphrases: [...this.keyphrases],
        descriptions: [...this.descriptions],
        supportedLayers: this.supportedLayers.toObject()
      };
  
      if (this.languages) {
        result.languages = [...this.languages];
      }
  
      return result;
    }
  
    toJSON(): string {
      return JSON.stringify(this.toObject());
    }
  
    static fromObject(data: Record<string, unknown>): Capability {
      if (!hasRequiredProperties(data, ['keyphrases', 'descriptions'])) {
        throw new Error('Capability requires keyphrases and descriptions');
      }
  
      return new Capability({
        keyphrases: data.keyphrases as string[],
        descriptions: data.descriptions as string[],
        ...(data.languages !== undefined ? { languages: data.languages as string[] } : {}),
        ...(data.supportedLayers !== undefined ? { supportedLayers: SupportedLayers.fromObject(data.supportedLayers as Record<string, unknown>).toObject() as SupportedLayersOptions } : {})
      });
    }
  }
  
  /**
   * Represents an agent manifest containing identification and capabilities
   * 
   * @example
   * ```typescript
   * const manifest = new Manifest({
   *   identification: {
   *     speakerUri: 'tag:example.com,2025:weather-bot',
   *     serviceUrl: 'https://example.com/weather-bot',
   *     organization: 'Weather Corp',
   *     conversationalName: 'WeatherBot',
   *     synopsis: 'Weather information assistant'
   *   },
   *   capabilities: [{
   *     keyphrases: ['weather', 'forecast'],
   *     descriptions: ['Provides weather forecasts and current conditions']
   *   }]
   * });
   * ```
   */
  export class Manifest implements JsonSerializable {
    readonly identification: Identification;
    readonly capabilities: readonly Capability[];
  
    /**
     * Creates a new Manifest instance
     * @param options - Manifest configuration options
     * @throws Error if required fields are missing
     */
    constructor(options: ManifestOptions) {
      const { identification, capabilities = [] } = options;
  
      if (!identification) {
        throw new Error(createValidationError(
          'Manifest.identification', 
          identification, 
          'Identification object'
        ));
      }
  
      this.identification = new Identification(identification);
      this.capabilities = Object.freeze(capabilities.map(cap => new Capability(cap)));
    }
  
    toObject(): Record<string, unknown> {
      return {
        identification: this.identification.toObject(),
        capabilities: this.capabilities.map(cap => cap.toObject())
      };
    }
  
    toJSON(): string {
      return JSON.stringify(this.toObject());
    }
  
    static fromObject(data: Record<string, unknown>): Manifest {
      if (!hasRequiredProperties(data, ['identification', 'capabilities'])) {
        throw new Error('Manifest requires identification and capabilities');
      }
      const idObj = data.identification as Record<string, unknown>;
      if (!hasRequiredProperties(idObj, ['speakerUri', 'serviceUrl', 'organization', 'conversationalName', 'synopsis'])) {
        throw new Error('Identification requires all required fields');
      }
      const capabilitiesArr = Array.isArray(data.capabilities)
        ? data.capabilities.map(capData => {
            const capObj = capData as Record<string, unknown>;
            if (!hasRequiredProperties(capObj, ['keyphrases', 'descriptions'])) {
              throw new Error('Capability requires keyphrases and descriptions');
            }
            return {
              keyphrases: capObj.keyphrases as string[],
              descriptions: capObj.descriptions as string[],
              ...(capObj.languages !== undefined ? { languages: capObj.languages as string[] } : {}),
              ...(capObj.supportedLayers !== undefined ? { supportedLayers: capObj.supportedLayers as SupportedLayersOptions } : {})
            } as CapabilityOptions;
          })
        : [];
      return new Manifest({
        identification: {
          speakerUri: idObj.speakerUri as string,
          serviceUrl: idObj.serviceUrl as string,
          organization: idObj.organization as string,
          conversationalName: idObj.conversationalName as string,
          synopsis: idObj.synopsis as string,
          ...(idObj.department !== undefined ? { department: idObj.department as string } : {}),
          ...(idObj.role !== undefined ? { role: idObj.role as string } : {})
        },
        capabilities: capabilitiesArr
      });
    }
  }
  
  /**
   * Represents a conversant in a conversation with identification and persistent state
   * 
   * @example
   * ```typescript
   * const conversant = new Conversant({
   *   identification: {
   *     speakerUri: 'tag:example.com,2025:user1',
   *     serviceUrl: 'https://example.com/user-proxy',
   *     conversationalName: 'User'
   *   },
   *   persistentState: { preferences: { language: 'en-US' } }
   * });
   * ```
   */
  export class Conversant implements JsonSerializable {
    readonly identification: Identification;
    readonly persistentState: Record<string, unknown>;
  
    /**
     * Creates a new Conversant instance
     * @param options - Conversant configuration options
     * @throws Error if identification is missing
     */
    constructor(options: ConversantOptions) {
      const { identification, persistentState = {} } = options;
  
      if (!identification) {
        throw new Error(createValidationError(
          'Conversant.identification', 
          identification, 
          'Identification object'
        ));
      }
  
      this.identification = new Identification(identification);
      this.persistentState = { ...persistentState };
    }
  
    toObject(): Record<string, unknown> {
      const result: Record<string, unknown> = {
        identification: this.identification.toObject()
      };
  
      if (Object.keys(this.persistentState).length > 0) {
        result.persistentState = { ...this.persistentState };
      }
  
      return result;
    }
  
    toJSON(): string {
      return JSON.stringify(this.toObject());
    }
  
    static fromObject(data: Record<string, unknown>): Conversant {
      if (!hasRequiredProperties(data, ['identification'])) {
        throw new Error('Conversant requires identification');
      }
      const idObj = data.identification as Record<string, unknown>;
      if (!hasRequiredProperties(idObj, ['speakerUri', 'serviceUrl', 'organization', 'conversationalName', 'synopsis'])) {
        throw new Error('Identification requires all required fields');
      }
      return new Conversant({
        identification: {
          speakerUri: idObj.speakerUri as string,
          serviceUrl: idObj.serviceUrl as string,
          organization: idObj.organization as string,
          conversationalName: idObj.conversationalName as string,
          synopsis: idObj.synopsis as string,
          ...(idObj.department !== undefined ? { department: idObj.department as string } : {}),
          ...(idObj.role !== undefined ? { role: idObj.role as string } : {})
        },
        ...(data.persistentState !== undefined ? { persistentState: data.persistentState as Record<string, unknown> } : {})
      });
    }
  }
  
  /**
   * Represents conversation metadata including ID and participants
   * 
   * @example
   * ```typescript
   * const conversation = new Conversation({
   *   id: 'conv:12345',
   *   conversants: [{
   *     identification: {
   *       speakerUri: 'tag:example.com,2025:user1',
   *       serviceUrl: 'https://example.com/user-proxy'
   *     }
   *   }]
   * });
   * ```
   */
  export class Conversation implements JsonSerializable {
    readonly id: string;
    readonly conversants: readonly Conversant[];
  
    /**
     * Creates a new Conversation instance
     * @param options - Conversation configuration options
     */
    constructor(options: ConversationOptions) {
      const { id, conversants = [] } = options;
      if (!id) throw new Error('Conversation.id is required');
      this.id = id;
      this.conversants = Object.freeze(conversants.map(conv => new Conversant(conv)));
    }
  
    toObject(): Record<string, unknown> {
      const result: Record<string, unknown> = { id: this.id };
  
      if (this.conversants.length > 0) {
        result.conversants = this.conversants.map(conv => conv.toObject());
      }
  
      return result;
    }
  
    toJSON(): string {
      return JSON.stringify(this.toObject());
    }
  
    static fromObject(data: Record<string, unknown>): Conversation {
      if (!hasRequiredProperties(data, ['id'])) {
        throw new Error('Conversation requires id');
      }
      let conversantsArr: ConversantOptions[] | undefined = undefined;
      if (Array.isArray(data.conversants)) {
        conversantsArr = data.conversants.map(convData => {
          const convObj = convData as Record<string, unknown>;
          if (!hasRequiredProperties(convObj, ['identification'])) {
            throw new Error('Conversant requires identification');
          }
          const idObj = convObj.identification as Record<string, unknown>;
          if (!hasRequiredProperties(idObj, ['speakerUri', 'serviceUrl', 'organization', 'conversationalName', 'synopsis'])) {
            throw new Error('Identification requires all required fields');
          }
          return {
            identification: {
              speakerUri: idObj.speakerUri as string,
              serviceUrl: idObj.serviceUrl as string,
              organization: idObj.organization as string,
              conversationalName: idObj.conversationalName as string,
              synopsis: idObj.synopsis as string,
              ...(idObj.department !== undefined ? { department: idObj.department as string } : {}),
              ...(idObj.role !== undefined ? { role: idObj.role as string } : {})
            },
            ...(convObj.persistentState !== undefined ? { persistentState: convObj.persistentState as Record<string, unknown> } : {})
          };
        });
      }
      return new Conversation({
        id: data.id as string,
        ...(conversantsArr ? { conversants: conversantsArr } : {})
      });
    }
  }
  
  /**
   * Represents sender information for envelope messages
   * 
   * @example
   * ```typescript
   * const sender = new Sender({
   *   speakerUri: 'tag:example.com,2025:agent1',
   *   serviceUrl: 'https://example.com/agent'
   * });
   * ```
   */
  export class Sender implements JsonSerializable {
    readonly speakerUri: string;
    readonly serviceUrl?: string;
  
    /**
     * Creates a new Sender instance
     * @param options - Sender configuration options
     * @throws Error if speakerUri is missing or invalid
     */
    constructor(options: SenderOptions) {
      const { speakerUri, serviceUrl } = options;
  
      if (!speakerUri) {
        throw new Error(createValidationError(
          'Sender.speakerUri', 
          speakerUri, 
          'non-empty string'
        ));
      }
  
      if (!isValidUri(speakerUri)) {
        throw new Error(createValidationError(
          'Sender.speakerUri', 
          speakerUri, 
          'valid URI format'
        ));
      }
  
      this.speakerUri = speakerUri;
      if (serviceUrl !== undefined) this.serviceUrl = serviceUrl;
    }
  
    toObject(): Record<string, unknown> {
      const result: Record<string, unknown> = { speakerUri: this.speakerUri };
      
      if (this.serviceUrl) {
        result.serviceUrl = this.serviceUrl;
      }
  
      return result;
    }
  
    toJSON(): string {
      return JSON.stringify(this.toObject());
    }
  
    static fromObject(data: Record<string, unknown>): Sender {
      if (!hasRequiredProperties(data, ['speakerUri'])) {
        throw new Error('Sender requires speakerUri');
      }
  
      return new Sender({
        speakerUri: data.speakerUri as string,
        ...(data.serviceUrl !== undefined ? { serviceUrl: data.serviceUrl as string } : {})
      });
    }
  }
  
  /**
   * Represents targeting information for events (who the event is addressed to)
   * 
   * @example
   * ```typescript
   * // Address to specific agent
   * const to1 = new To({
   *   speakerUri: 'tag:example.com,2025:agent1'
   * });
   * 
   * // Private message to specific service
   * const to2 = new To({
   *   serviceUrl: 'https://example.com/agent',
   *   private: true
   * });
   * ```
   */
  export class To implements JsonSerializable {
    readonly speakerUri?: string;
    readonly serviceUrl?: string;
    readonly private: boolean;
  
    /**
     * Creates a new To instance
     * @param options - To configuration options
     * @throws Error if neither speakerUri nor serviceUrl is provided
     */
    constructor(options: ToOptions) {
      const { speakerUri, serviceUrl, private: isPrivate } = options;
      if (!speakerUri && !serviceUrl) {
        throw new Error('To requires at least speakerUri or serviceUrl');
      }
      if (speakerUri !== undefined) this.speakerUri = speakerUri;
      if (serviceUrl !== undefined) this.serviceUrl = serviceUrl;
      this.private = !!isPrivate;
    }
  
    toObject(): Record<string, unknown> {
      const result: Record<string, unknown> = {};
  
      if (this.speakerUri) {
        result.speakerUri = this.speakerUri;
      }
      if (this.serviceUrl) {
        result.serviceUrl = this.serviceUrl;
      }
      if (this.private) {
        result.private = this.private;
      }
  
      return result;
    }
  
    toJSON(): string {
      return JSON.stringify(this.toObject());
    }
  
    static fromObject(data: Record<string, unknown>): To {
      if (!data.speakerUri && !data.serviceUrl) {
        throw new Error('To requires at least speakerUri or serviceUrl');
      }
      return new To({
        ...(data.speakerUri !== undefined ? { speakerUri: data.speakerUri as string } : {}),
        ...(data.serviceUrl !== undefined ? { serviceUrl: data.serviceUrl as string } : {}),
        ...(data.private !== undefined ? { private: data.private as boolean } : {})
      });
    }
  }
  
  /**
   * Base class for all Open Floor Protocol events
   * 
   * @example
   * ```typescript
   * const event = new Event({
   *   eventType: 'utterance',
   *   to: { speakerUri: 'tag:example.com,2025:agent1' },
   *   reason: 'User query',
   *   parameters: { dialogEvent: {...} }
   * });
   * ```
   */
  export class Event implements JsonSerializable {
    readonly eventType: string;
    readonly to?: To;
    readonly reason?: string;
    readonly parameters: Record<string, unknown>;
  
    /**
     * Creates a new Event instance
     * @param options - Event configuration options
     * @throws Error if eventType is missing or invalid
     */
    constructor(options: BaseEventOptions) {
      const allowedEventTypes = [
        'utterance', 'context', 'invite', 'uninvite', 'declineInvite', 'bye',
        'getManifests', 'publishManifests', 'requestFloor', 'grantFloor', 'revokeFloor', 'yieldFloor'
      ];
      if (!options.eventType || !allowedEventTypes.includes(options.eventType)) {
        throw new Error(`Invalid eventType: ${options.eventType}`);
      }
      const { eventType, to, reason, parameters } = options;
      this.eventType = eventType as string;
      if (to !== undefined) this.to = new To(to);
      if (reason !== undefined) this.reason = reason;
      this.parameters = parameters ? { ...parameters } : {};
    }
  
    toObject(): Record<string, unknown> {
      const result: Record<string, unknown> = { eventType: this.eventType };
  
      if (this.to) {
        result.to = this.to.toObject();
      }
      if (this.reason) {
        result.reason = this.reason;
      }
      if (Object.keys(this.parameters).length > 0) {
        result.parameters = { ...this.parameters };
      }
  
      return result;
    }
  
    toJSON(): string {
      return JSON.stringify(this.toObject());
    }
  
    static fromObject(data: Record<string, unknown>): Event {
      if (!hasRequiredProperties(data, ['eventType'])) {
        throw new Error('Event requires eventType');
      }
      const eventTypeValue = data.eventType as string;
      const validEventTypes = [
        'utterance', 'context', 'invite', 'uninvite', 'declineInvite', 'bye',
        'getManifests', 'publishManifests', 'requestFloor', 'grantFloor', 'revokeFloor', 'yieldFloor'
      ];
      if (!validEventTypes.includes(eventTypeValue)) {
        throw new Error('Invalid eventType');
      }
      const options: BaseEventOptions = {
        eventType: eventTypeValue as EventType,
        ...(data.to && typeof data.to === 'object' ? { to: To.fromObject(data.to as Record<string, unknown>).toObject() as ToOptions } : {}),
        ...(data.reason !== undefined ? { reason: data.reason as string } : {}),
        ...(data.parameters !== undefined ? { parameters: data.parameters as Record<string, unknown> } : {})
      };
      return new Event(options);
    }
  }
  
  /**
   * Represents an Open Floor Protocol message envelope
   * Contains schema, conversation, sender, and events information
   * 
   * @example
   * ```typescript
   * const envelope = new Envelope({
   *   conversation: { id: 'conv:12345' },
   *   sender: { speakerUri: 'tag:example.com,2025:agent1' },
   *   events: [{
   *     eventType: 'utterance',
   *     parameters: { dialogEvent: {...} }
   *   }]
   * });
   * ```
   */
  export class Envelope implements JsonSerializable {
    readonly schema: Schema;
    readonly conversation: Conversation;
    readonly sender: Sender;
    readonly events: readonly Event[];
  
    /**
     * Creates a new Envelope instance
     * @param options - Envelope configuration options
     * @throws Error if required fields are missing
     */
    constructor(options: EnvelopeOptions) {
      const { schema, conversation, sender, events } = options;
      if (!schema) throw new Error('Envelope.schema is required');
      if (!conversation) throw new Error('Envelope.conversation is required');
      if (!sender) throw new Error('Envelope.sender is required');
      if (!events) throw new Error('Envelope.events is required');
      this.schema = new Schema(schema);
      this.conversation = new Conversation(conversation);
      this.sender = new Sender(sender);
      this.events = Object.freeze(events.map(eventOpts => new Event(eventOpts)));
    }
  
    toObject(): Record<string, unknown> {
      return {
        schema: this.schema.toObject(),
        conversation: this.conversation.toObject(),
        sender: this.sender.toObject(),
        events: this.events.map(event => event.toObject())
      };
    }
  
    toJSON(): string {
      return JSON.stringify(this.toObject());
    }
  
    /**
     * Creates a wrapped payload for the envelope (adds openFloor wrapper)
     */
    toPayload(): Payload {
      return new Payload({
        openFloor: {
          schema: { version: this.schema.version, ...(this.schema.url ? { url: this.schema.url } : {}) },
          conversation: {
            id: this.conversation.id,
            ...(this.conversation.conversants && this.conversation.conversants.length > 0
              ? {
                  conversants: this.conversation.conversants.map(c => {
                    const obj = c.toObject();
                    if (!obj.identification || typeof obj.identification !== 'object' || !hasRequiredProperties(obj.identification, ['speakerUri', 'serviceUrl', 'organization', 'conversationalName', 'synopsis'])) {
                      throw new Error('Conversant.identification is missing required fields');
                    }
                    const idObj = obj.identification as Record<string, unknown>;
                    return {
                      identification: {
                        speakerUri: idObj.speakerUri as string,
                        serviceUrl: idObj.serviceUrl as string,
                        organization: idObj.organization as string,
                        conversationalName: idObj.conversationalName as string,
                        synopsis: idObj.synopsis as string,
                        ...(idObj.department !== undefined ? { department: idObj.department as string } : {}),
                        ...(idObj.role !== undefined ? { role: idObj.role as string } : {})
                      },
                      ...(obj.persistentState !== undefined ? { persistentState: obj.persistentState as Record<string, unknown> } : {})
                    };
                  })
                }
              : {})
          },
          sender: { speakerUri: this.sender.speakerUri, ...(this.sender.serviceUrl ? { serviceUrl: this.sender.serviceUrl } : {}) },
          events: this.events.map(e => {
            const base: BaseEventOptions = {
              eventType: e.eventType as EventType,
              parameters: e.parameters
            };
            if (e.to) base.to = e.to.toObject() as ToOptions;
            if (e.reason) base.reason = e.reason;
            return base;
          })
        }
      });
    }
  
    static fromObject(data: Record<string, unknown>): Envelope {
      if (!hasRequiredProperties(data, ['schema', 'conversation', 'sender', 'events'])) {
        throw new Error('Envelope requires schema, conversation, sender, and events');
      }
      const schemaObj = Schema.fromObject(data.schema as Record<string, unknown>);
      const conversationObj = Conversation.fromObject(data.conversation as Record<string, unknown>);
      const senderObj = Sender.fromObject(data.sender as Record<string, unknown>);
      const eventsArr = Array.isArray(data.events)
        ? data.events.map(eventData => Event.fromObject(eventData as Record<string, unknown>))
        : [];
      return new Envelope({
        schema: { version: schemaObj.version, ...(schemaObj.url ? { url: schemaObj.url } : {}) },
        conversation: {
          id: conversationObj.id,
          ...(conversationObj.conversants && conversationObj.conversants.length > 0
            ? {
                conversants: conversationObj.conversants.map(c => {
                  const obj = c.toObject();
                  if (!obj.identification || typeof obj.identification !== 'object' || !hasRequiredProperties(obj.identification, ['speakerUri', 'serviceUrl', 'organization', 'conversationalName', 'synopsis'])) {
                    throw new Error('Conversant.identification is missing required fields');
                  }
                  const idObj = obj.identification as Record<string, unknown>;
                  return {
                    identification: {
                      speakerUri: idObj.speakerUri as string,
                      serviceUrl: idObj.serviceUrl as string,
                      organization: idObj.organization as string,
                      conversationalName: idObj.conversationalName as string,
                      synopsis: idObj.synopsis as string,
                      ...(idObj.department !== undefined ? { department: idObj.department as string } : {}),
                      ...(idObj.role !== undefined ? { role: idObj.role as string } : {})
                    },
                    ...(obj.persistentState !== undefined ? { persistentState: obj.persistentState as Record<string, unknown> } : {})
                  };
                })
              }
            : {})
        },
        sender: { speakerUri: senderObj.speakerUri, ...(senderObj.serviceUrl ? { serviceUrl: senderObj.serviceUrl } : {}) },
        events: eventsArr.map(e => {
          const base: BaseEventOptions = {
            eventType: e.eventType as EventType,
            parameters: e.parameters
          };
          if (e.to) base.to = e.to.toObject() as ToOptions;
          if (e.reason) base.reason = e.reason;
          return base;
        })
      });
    }
  }
  
  /**
   * Represents a payload wrapper that contains an Open Floor envelope
   * This is the top-level structure as defined in the specification
   * 
   * @example
   * ```typescript
   * const payload = new Payload({
   *   openFloor: {
   *     conversation: { id: 'conv:12345' },
   *     sender: { speakerUri: 'tag:example.com,2025:agent1' },
   *     events: []
   *   }
   * });
   * ```
   */
  export class Payload implements JsonSerializable {
    readonly openFloor: Envelope;
  
    /**
     * Creates a new Payload instance
     * @param options - Payload configuration options
     * @throws Error if openFloor is missing
     */
    constructor(options: PayloadOptions) {
      const { openFloor } = options;
      if (!openFloor) throw new Error('Payload.openFloor is required');
      this.openFloor = new Envelope(openFloor);
    }
  
    toObject(): Record<string, unknown> {
      return {
        openFloor: this.openFloor.toObject()
      };
    }
  
    toJSON(): string {
      return JSON.stringify(this.toObject());
    }
  
    static fromObject(data: Record<string, unknown>): Payload {
      if (!hasRequiredProperties(data, ['openFloor'])) {
        throw new Error('Payload requires openFloor');
      }
      const openFloorObj = Envelope.fromObject(data.openFloor as Record<string, unknown>);
      return new Payload({
        openFloor: {
          schema: { version: openFloorObj.schema.version, ...(openFloorObj.schema.url ? { url: openFloorObj.schema.url } : {}) },
          conversation: {
            id: openFloorObj.conversation.id,
            ...(openFloorObj.conversation.conversants && openFloorObj.conversation.conversants.length > 0
              ? {
                  conversants: openFloorObj.conversation.conversants.map(c => {
                    const obj = c.toObject();
                    if (!obj.identification || typeof obj.identification !== 'object' || !hasRequiredProperties(obj.identification, ['speakerUri', 'serviceUrl', 'organization', 'conversationalName', 'synopsis'])) {
                      throw new Error('Conversant.identification is missing required fields');
                    }
                    const idObj = obj.identification as Record<string, unknown>;
                    return {
                      identification: {
                        speakerUri: idObj.speakerUri as string,
                        serviceUrl: idObj.serviceUrl as string,
                        organization: idObj.organization as string,
                        conversationalName: idObj.conversationalName as string,
                        synopsis: idObj.synopsis as string,
                        ...(idObj.department !== undefined ? { department: idObj.department as string } : {}),
                        ...(idObj.role !== undefined ? { role: idObj.role as string } : {})
                      },
                      ...(obj.persistentState !== undefined ? { persistentState: obj.persistentState as Record<string, unknown> } : {})
                    };
                  })
                }
              : {})
          },
          sender: { speakerUri: openFloorObj.sender.speakerUri, ...(openFloorObj.sender.serviceUrl ? { serviceUrl: openFloorObj.sender.serviceUrl } : {}) },
          events: openFloorObj.events.map(e => {
            const base: BaseEventOptions = {
              eventType: e.eventType as EventType,
              parameters: e.parameters
            };
            if (e.to) base.to = e.to.toObject() as ToOptions;
            if (e.reason) base.reason = e.reason;
            return base;
          })
        }
      });
    }
  
    /**
     * Creates a Payload from a JSON string
     */
    static fromJSON(jsonString: string): Payload {
      try {
        const data = JSON.parse(jsonString);
        return Payload.fromObject(data);
      } catch (error) {
        throw new Error(`Failed to parse JSON payload: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }