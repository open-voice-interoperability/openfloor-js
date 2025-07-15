/**
 * @fileoverview Core types and interfaces for the Open Floor Protocol
 * Based on Open Floor specifications v1.0.0
 * @author Open Voice Interoperability Initiative
 * @version 0.0.1
 * @license Apache-2.0
 */

/**
 * Valid event types as defined in the Open Floor Protocol specification
 */
export type EventType = 
  | 'utterance'
  | 'context' 
  | 'invite'
  | 'uninvite'
  | 'declineInvite'
  | 'bye'
  | 'getManifests'
  | 'publishManifest'
  | 'requestFloor'
  | 'grantFloor'
  | 'revokeFloor'
  | 'yieldFloor';

/**
 * Recommendation scope for getManifests events
 */
export type RecommendScope = 'internal' | 'external' | 'all';

/**
 * Reason tokens for floor management events
 */
export type FloorReasonToken = 
  | '@timedOut'
  | '@brokenPolicy' 
  | '@override'
  | '@error'
  | '@outOfDomain'
  | '@complete'
  | '@unavailable'
  | '@refused';

/**
 * Configuration options for creating a Span
 */
export interface SpanOptions {
  /** Absolute start time */
  startTime?: Date;
  /** Relative start offset in milliseconds */
  startOffset?: number;
  /** Absolute end time */
  endTime?: Date;
  /** Relative end offset in milliseconds */
  endOffset?: number;
}

/**
 * Configuration options for creating a Token
 */
export interface TokenOptions {
  /** The token value (any JSON-serializable type) */
  value?: unknown;
  /** URL reference to external token value */
  valueUrl?: string;
  /** Time span for this token */
  span?: SpanOptions;
  /** Confidence score (0.0 to 1.0) */
  confidence?: number;
  /** JSON Path references to other tokens */
  links?: string[];
}

/**
 * Configuration options for creating a Feature
 */
export interface FeatureOptions {
  /** MIME type of the feature content */
  mimeType: string;
  /** Array of tokens that make up this feature */
  tokens?: TokenOptions[];
  /** Alternative interpretations of this feature */
  alternates?: TokenOptions[][];
  /** BCP 47 language tag */
  lang?: string;
  /** Text encoding ("ISO-8859-1" or "UTF-8") */
  encoding?: string;
  /** Schema reference for token values */
  tokenSchema?: string;
}

/**
 * Configuration options for creating a TextFeature
 */
export interface TextFeatureOptions extends Omit<FeatureOptions, 'mimeType'> {
  /** Array of text values (convenience property) */
  values?: string[];
  mimeType?: 'text/plain';
}

/**
 * Configuration options for creating a DialogEvent
 */
export interface DialogEventOptions {
  /** Speaker URI (required) */
  speakerUri: string;
  /** Unique identifier (auto-generated if not provided) */
  id?: string;
  /** Time span of the event */
  span?: SpanOptions;
  /** Features associated with this event */
  features?: Record<string, FeatureOptions>;
  /** Reference to previous dialog event */
  previousId?: string;
  /** Additional context for this event */
  context?: string;
}

/**
 * Configuration options for schema information
 */
export interface SchemaOptions {
  /** Protocol version */
  version: string;
  /** URL to schema definition */
  url?: string;
}

/**
 * Configuration options for identification information
 */
export interface IdentificationOptions {
  /** Unique speaker URI (required) */
  speakerUri: string;
  /** Service endpoint URL (required) */
  serviceUrl: string;
  /** Organization name */
  organization: string;
  /** Conversational name of the agent */
  conversationalName: string;
  /** Brief synopsis of capabilities */
  synopsis: string;
  /** Department within organization */
  department?: string;
  /** Role or job title */
  role?: string;
}

/**
 * Configuration options for supported layers
 */
export interface SupportedLayersOptions {
  /** Input layer types */
  input?: string[];
  /** Output layer types */
  output?: string[];
}

/**
 * Configuration options for capability definition
 */
export interface CapabilityOptions {
  /** Key phrases describing this capability */
  keyphrases: string[];
  /** Detailed descriptions of this capability */
  descriptions: string[];
  /** Supported languages (BCP 47 tags) */
  languages?: string[];
  /** Supported input/output layers */
  supportedLayers?: SupportedLayersOptions;
}

/**
 * Configuration options for agent manifest
 */
export interface ManifestOptions {
  /** Agent identification information */
  identification: IdentificationOptions;
  /** Array of agent capabilities */
  capabilities: CapabilityOptions[];
}

/**
 * Configuration options for conversant information
 */
export interface ConversantOptions {
  /** Identification information */
  identification: IdentificationOptions;
  /** Persistent state data */
  persistentState?: Record<string, unknown>;
}

/**
 * Configuration options for conversation information
 */
export interface ConversationOptions {
  /** Conversation ID (auto-generated if not provided) */
  id: string;
  /** Array of conversation participants */
  conversants?: ConversantOptions[];
}

/**
 * Configuration options for sender information
 */
export interface SenderOptions {
  /** Speaker URI (required) */
  speakerUri: string;
  /** Service URL */
  serviceUrl?: string;
}

/**
 * Configuration options for event targeting
 */
export interface ToOptions {
  /** Target speaker URI */
  speakerUri?: string;
  /** Target service URL */
  serviceUrl?: string;
  /** Whether this is a private message */
  private?: boolean;
}

/**
 * Base configuration for all events
 */
export interface BaseEventOptions {
  /** Event type */
  eventType: EventType;
  /** Target information */
  to?: ToOptions;
  /** Reason for the event */
  reason?: string;
  /** Event parameters */
  parameters?: Record<string, unknown>;
}

/**
 * Configuration options for utterance events
 */
export interface UtteranceEventOptions extends Omit<BaseEventOptions, 'eventType'> {
  /** Dialog event containing the utterance */
  dialogEvent: DialogEventOptions;
}

/**
 * Configuration options for context events
 */
export interface ContextEventOptions extends Omit<BaseEventOptions, 'eventType'> {
  /** Dialog history */
  dialogHistory?: DialogEventOptions[];
  /** Additional context parameters */
  [key: string]: unknown;
}

/**
 * Configuration options for getManifests events
 */
export interface GetManifestsEventOptions extends Omit<BaseEventOptions, 'eventType'> {
  /** Recommendation scope */
  recommendScope?: RecommendScope;
}

/**
 * Configuration options for publishManifests events
 */
export interface PublishManifestsEventOptions extends Omit<BaseEventOptions, 'eventType'> {
  /** Manifests for servicing agents */
  servicingManifests?: ManifestOptions[];
  /** Manifests for discovery agents */
  discoveryManifests?: ManifestOptions[];
}

/**
 * Configuration options for envelope creation
 */
export interface EnvelopeOptions {
  /** Schema information */
  schema: SchemaOptions;
  /** Conversation information */
  conversation: ConversationOptions;
  /** Sender information */
  sender: SenderOptions;
  /** Array of events */
  events: BaseEventOptions[];
}

/**
 * Configuration options for payload wrapper
 */
export interface PayloadOptions {
  /** The Open Floor envelope */
  openFloor: EnvelopeOptions;
}

/**
 * Interface for objects that can be serialized to JSON
 */
export interface JsonSerializable {
  /** Convert to JSON string */
  toJSON(): string;
  /** Convert to plain object */
  toObject(): Record<string, unknown>;
}

/**
 * Interface for validation results
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Array of validation errors */
  errors: string[];
}

/**
 * Interface for agent event handlers
 */
export interface AgentEventHandlers {
  onEnvelope?: (envelope: unknown) => Promise<unknown>;
  onUtterance?: (event: unknown) => Promise<void>;
  onContext?: (event: unknown) => Promise<void>;
  onInvite?: (event: unknown) => Promise<void>;
  onUninvite?: (event: unknown) => Promise<void>;
  onDeclineInvite?: (event: unknown) => Promise<void>;
  onBye?: (event: unknown) => Promise<void>;
  onGetManifests?: (event: unknown) => Promise<void>;
  onPublishManifests?: (event: unknown) => Promise<void>;
  onRequestFloor?: (event: unknown) => Promise<void>;
  onGrantFloor?: (event: unknown) => Promise<void>;
  onRevokeFloor?: (event: unknown) => Promise<void>;
  onYieldFloor?: (event: unknown) => Promise<void>;
}