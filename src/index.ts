/**
 * @fileoverview Open Floor Protocol - Main entry point
 * Complete TypeScript implementation of the Open Floor Protocol specifications
 * @author Open Voice Interoperability Initiative
 * @version 0.0.1
 * @license Apache-2.0
 */

import { generateUUID } from './utils';

// Core types and interfaces
export type {
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
  EventType,
  UtteranceEventOptions,
  ContextEventOptions,
  GetManifestsEventOptions,
  PublishManifestsEventOptions,
  RecommendScope,
  FloorReasonToken,
  AgentEventHandlers,
  ValidationResult
} from './types';

// Utility functions
export {
  parseIsoDuration,
  millisecondsToIsoDuration,
  generateUUID,
  resolveJsonPath,
  isValidUri,
  isValidUrl,
  isValidConfidence,
  isValidEncoding,
  deepClone,
  hasRequiredProperties,
  createValidationError
} from './utils';

// Dialog Event classes and types
export {
  Span,
  Token,
  Feature,
  TextFeature,
  DialogEvent
} from './dialog-event';
export type { DialogHistory } from './dialog-event';

// Envelope and Manifest classes
export {
  Schema,
  Identification,
  SupportedLayers,
  Capability,
  Manifest,
  Conversant,
  Conversation,
  Sender,
  To,
  Event,
  Envelope,
  Payload
} from './envelope';

// Event classes and utilities
export {
  UtteranceEvent,
  ContextEvent,
  InviteEvent,
  UninviteEvent,
  DeclineInviteEvent,
  ByeEvent,
  GetManifestsEvent,
  PublishManifestEvent,
  RequestFloorEvent,
  GrantFloorEvent,
  RevokeFloorEvent,
  YieldFloorEvent,
  createEvent,
  isUtteranceEvent,
  isContextEvent,
  isInviteEvent,
  isUninviteEvent,
  isDeclineInviteEvent,
  isByeEvent,
  isGetManifestsEvent,
  isPublishManifestEvent,
  isRequestFloorEvent,
  isGrantFloorEvent,
  isRevokeFloorEvent,
  isYieldFloorEvent
} from './events';

// Agent classes
export {
  OpenFloorAgent,
  BotAgent,
  FloorManager,
  ConvenerAgent
} from './agents';

// Validation functions and schemas
export {
  validateDialogEvent,
  validateManifest,
  validateEnvelope,
  validateDialogEventEnhanced,
  validateManifestEnhanced,
  validateEnvelopeEnhanced,
  EnhancedValidator
} from './validation';

// Version information
export const VERSION = '0.0.1';

/**
 * Library information
 */
export const OPEN_FLOOR_PROTOCOL = {
  name: '@openfloor/protocol',
  version: VERSION,
  description: 'Open Floor Protocol implementation for JavaScript/TypeScript',
  specifications: {
    envelope: '1.0.0',
    dialogEvent: '1.0.2',
    manifest: '1.0.0'
  },
  repository: 'https://github.com/open-voice-interoperability/openfloor-js',
  documentation: 'https://github.com/open-voice-interoperability/openfloor-js#readme'
} as const;

/**
 * Convenience factory functions for common use cases
 */

/**
 * Creates a simple text utterance event
 * @param options - Utterance options
 * @returns UtteranceEvent instance
 * 
 * @example
 * ```typescript
 * const utterance = createTextUtterance({
 *   speakerUri: 'tag:example.com,2025:user1',
 *   text: 'Hello world',
 *   to: { speakerUri: 'tag:example.com,2025:bot1' }
 * });
 * ```
 */
export function createTextUtterance(options: {
  speakerUri: string;
  text: string;
  to?: { speakerUri?: string; serviceUrl?: string; private?: boolean };
  confidence?: number;
  lang?: string;
}): UtteranceEvent {
  const { speakerUri, text, to, confidence, lang } = options;

  const features: any = {
    text: {
      mimeType: 'text/plain',
      tokens: [{ value: text, ...(confidence !== undefined ? { confidence } : {}) }],
      ...(lang !== undefined ? { lang } : {})
    }
  };

  const dialogEvent: any = {
    id: generateUUID(),
    speakerUri,
    span: { startTime: new Date() },
    features
  };

  const toOptions = to && (to.speakerUri || to.serviceUrl || to.private !== undefined)
    ? { ...to }
    : undefined;

  return new UtteranceEvent({
    dialogEvent,
    ...(toOptions ? { to: toOptions } : {})
  });
}

/**
 * Creates a basic agent manifest
 * @param options - Manifest options
 * @returns Manifest instance
 * 
 * @example
 * ```typescript
 * const manifest = createBasicManifest({
 *   speakerUri: 'tag:example.com,2025:bot1',
 *   serviceUrl: 'https://example.com/bot',
 *   name: 'Assistant',
 *   organization: 'Example Corp',
 *   description: 'A helpful assistant',
 *   capabilities: ['chat', 'help']
 * });
 * ```
 */
export function createBasicManifest(options: {
  speakerUri: string;
  serviceUrl: string;
  name: string;
  organization: string;
  description: string;
  capabilities?: string[];
  department?: string;
  role?: string;
}): Manifest {
  const {
    speakerUri,
    serviceUrl,
    name,
    organization,
    description,
    capabilities = [],
    department,
    role
  } = options;

  const identification: any = {
    speakerUri,
    serviceUrl,
    organization,
    conversationalName: name,
    synopsis: description,
    ...(department !== undefined ? { department } : {}),
    ...(role !== undefined ? { role } : {})
  };

  const caps = capabilities.length > 0
    ? [{ keyphrases: capabilities, descriptions: [description] }]
    : [];

  return new Manifest({
    identification,
    capabilities: caps
  });
}

/**
 * Creates a simple conversation envelope
 * @param options - Envelope options
 * @returns Envelope instance
 * 
 * @example
 * ```typescript
 * const envelope = createSimpleEnvelope({
 *   conversationId: 'conv:123',
 *   senderUri: 'tag:example.com,2025:bot1',
 *   events: [utteranceEvent]
 * });
 * ```
 */
export function createSimpleEnvelope(options: {
  conversationId?: string;
  senderUri: string;
  senderServiceUrl?: string;
  events?: Event[];
  schemaVersion?: string;
  schemaUrl?: string;
}): Envelope {
  const { conversationId, senderUri, senderServiceUrl, events = [], schemaVersion = '1.0.0', schemaUrl } = options;

  const schema = schemaUrl ? { version: schemaVersion, url: schemaUrl } : { version: schemaVersion };
  const conversation = { id: conversationId ?? generateUUID() };
  const sender: any = { speakerUri: senderUri };
  if (senderServiceUrl !== undefined) sender.serviceUrl = senderServiceUrl;

  return new Envelope({
    schema,
    conversation,
    sender,
    events: events.map(event => event.toObject() as any)
  });
}

/**
 * Creates a payload with openFloor wrapper
 * @param envelope - Envelope to wrap
 * @returns Payload instance
 * 
 * @example
 * ```typescript
 * const payload = createPayload(envelope);
 * console.log(payload.toJSON()); // {"openFloor": {...}}
 * ```
 */
export function createPayload(envelope: Envelope): Payload {
  return envelope.toPayload();
}

/**
 * Parses an Open Floor payload from JSON string
 * @param jsonString - JSON string to parse
 * @returns Parsed Payload instance
 * @throws Error if JSON is invalid
 * 
 * @example
 * ```typescript
 * const jsonString = '{"openFloor": {...}}';
 * const payload = parsePayload(jsonString);
 * ```
 */
export function parsePayload(jsonString: string): Payload {
  return Payload.fromJSON(jsonString);
}

/**
 * Validates and parses an Open Floor payload
 * @param jsonString - JSON string to validate and parse
 * @returns Object containing validation result and parsed payload (if valid)
 * 
 * @example
 * ```typescript
 * const result = validateAndParsePayload(jsonString);
 * if (result.valid) {
 *   console.log('Payload is valid:', result.payload);
 * } else {
 *   console.error('Validation errors:', result.errors);
 * }
 * ```
 */
export function validateAndParsePayload(jsonString: string): {
  valid: boolean;
  errors: string[];
  payload?: Payload;
} {
  try {
    const data = JSON.parse(jsonString);
    const validation = validateEnvelope(data);
    
    if (validation.valid) {
      const payload = Payload.fromObject(data);
      return { valid: true, errors: [], payload };
    } else {
      return { valid: false, errors: validation.errors };
    }
  } catch (error) {
    return { 
      valid: false, 
      errors: [`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`] 
    };
  }
}

import { 
  UtteranceEvent, 
  ContextEvent, 
  InviteEvent, 
  UninviteEvent, 
  DeclineInviteEvent, 
  ByeEvent, 
  GetManifestsEvent, 
  PublishManifestEvent, 
  RequestFloorEvent, 
  GrantFloorEvent, 
  RevokeFloorEvent, 
  YieldFloorEvent 
} from './events';

import { 
  Span, 
  Token, 
  Feature, 
  TextFeature, 
  DialogEvent 
} from './dialog-event';

import { 
  Schema, 
  Identification, 
  SupportedLayers, 
  Capability, 
  Manifest, 
  Conversant, 
  Conversation, 
  Sender, 
  To, 
  Event, 
  Envelope, 
  Payload 
} from './envelope';

import { 
  OpenFloorAgent, 
  BotAgent, 
  FloorManager, 
  ConvenerAgent 
} from './agents';

import { validateDialogEvent, validateManifest, validateEnvelope } from './validation.js';

/**
 * Default export with all main classes for convenient importing
 */
export default {
  // Core classes
  Span,
  Token,
  Feature,
  TextFeature,
  DialogEvent,
  Schema,
  Identification,
  SupportedLayers,
  Capability,
  Manifest,
  Conversant,
  Conversation,
  Sender,
  To,
  Event,
  Envelope,
  Payload,
  
  // Event classes
  UtteranceEvent,
  ContextEvent,
  InviteEvent,
  UninviteEvent,
  DeclineInviteEvent,
  ByeEvent,
  GetManifestsEvent,
  PublishManifestEvent,
  RequestFloorEvent,
  GrantFloorEvent,
  RevokeFloorEvent,
  YieldFloorEvent,
  
  // Agent classes
  OpenFloorAgent,
  BotAgent,
  FloorManager,
  ConvenerAgent,
  
  // Factory functions
  createTextUtterance,
  createBasicManifest,
  createSimpleEnvelope,
  createPayload,
  parsePayload,
  validateAndParsePayload,
  
  // Validation
  validateDialogEvent,
  validateManifest,
  validateEnvelope,
  
  // Library info
  VERSION,
  OPEN_FLOOR_PROTOCOL
} as const;