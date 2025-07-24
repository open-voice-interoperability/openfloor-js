/**
 * @fileoverview Event classes for the Open Floor Protocol
 * Implements all event types from the Inter-Agent Message Specification v1.0.0
 * @author Open Voice Interoperability Initiative
 * @version 0.0.1
 * @license Apache-2.0
 */

import {
    UtteranceEventOptions,
    ContextEventOptions,
    GetManifestsEventOptions,
    PublishManifestsEventOptions,
    RecommendScope,
    ToOptions,
    BaseEventOptions
  } from './types';
  import { Event, To } from './envelope';
  import { DialogEvent, DialogHistory } from './dialog-event';
  import { Manifest } from './envelope';
  import { createValidationError } from './utils';
  
  /**
   * Represents an utterance event containing spoken or written dialog
   * This is the primary communication event between conversants
   * 
   * @example
   * ```typescript
   * const utteranceEvent = new UtteranceEvent({
   *   dialogEvent: {
   *     speakerUri: 'tag:example.com,2025:user1',
   *     features: {
   *       text: { mimeType: 'text/plain', tokens: [{ value: 'Hello world' }] }
   *     }
   *   },
   *   to: { speakerUri: 'tag:example.com,2025:agent1' }
   * });
   * ```
   */
  export class UtteranceEvent extends Event {
    readonly dialogEvent: DialogEvent;
  
    /**
     * Creates a new UtteranceEvent instance
     * @param options - UtteranceEvent configuration options
     * @throws Error if dialogEvent is missing
     */
    constructor(options: UtteranceEventOptions) {
      const { dialogEvent, to, reason } = options;
  
      if (!dialogEvent) {
        throw new Error(createValidationError(
          'UtteranceEvent.dialogEvent', 
          dialogEvent, 
          'DialogEvent object'
        ));
      }
  
      const dialogEventInstance = new DialogEvent(dialogEvent);
  
      const baseOptions: BaseEventOptions = { eventType: 'utterance', parameters: { dialogEvent: dialogEventInstance.toObject() } };
      if (to !== undefined) baseOptions.to = to;
      if (reason !== undefined) baseOptions.reason = reason;
      super(baseOptions);
  
      this.dialogEvent = dialogEventInstance;
    }
  
    static fromObject(data: Record<string, unknown>): UtteranceEvent {
      if (!data.parameters || typeof data.parameters !== 'object') {
        throw new Error('UtteranceEvent requires parameters with dialogEvent');
      }
  
      const params = data.parameters as Record<string, unknown>;
      if (!params.dialogEvent || typeof params.dialogEvent !== 'object') {
        throw new Error('UtteranceEvent requires dialogEvent parameter');
      }
  
      const options: UtteranceEventOptions = {
        dialogEvent: DialogEvent.fromObject(
          params.dialogEvent as Record<string, unknown>
        ).toObject() as any
      };
  
      if (data.reason !== undefined) options.reason = data.reason as string;
      if (data.to && typeof data.to === 'object') {
        options.to = To.fromObject(data.to as Record<string, unknown>).toObject() as ToOptions;
      }
  
      return new UtteranceEvent(options);
    }
  }
  
  /**
   * Represents a context event providing additional information to recipient agents
   * Contains dialog history and other contextual parameters
   * 
   * @example
   * ```typescript
   * const contextEvent = new ContextEvent({
   *   dialogHistory: [
   *     {
   *       speakerUri: 'tag:example.com,2025:user1',
   *       features: { text: { mimeType: 'text/plain', tokens: [{ value: 'Hello' }] } }
   *     }
   *   ],
   *   sessionData: { userId: '12345' }
   * });
   * ```
   */
  export class ContextEvent extends Event {
    readonly dialogHistory: DialogHistory;
  
    /**
     * Creates a new ContextEvent instance
     * @param options - ContextEvent configuration options
     */
    constructor(options: ContextEventOptions) {
      const { dialogHistory = [], to, reason, ...additionalParams } = options;
  
      const dialogHistoryInstance = dialogHistory.map(eventData => new DialogEvent(eventData));
  
      const parameters: Record<string, unknown> = {
        dialogHistory: dialogHistoryInstance.map(event => event.toObject()),
        ...additionalParams
      };
  
      const baseOptions: BaseEventOptions = { eventType: 'context', parameters };
      if (to !== undefined) baseOptions.to = to;
      if (reason !== undefined) baseOptions.reason = reason;
      super(baseOptions);
  
      this.dialogHistory = dialogHistoryInstance;
    }
  
    static fromObject(data: Record<string, unknown>): ContextEvent {
      const params = (data.parameters as Record<string, unknown>) || {};
      const options: ContextEventOptions = {
        dialogHistory: (params.dialogHistory as any[] || []).map(eventData =>
          DialogEvent.fromObject(eventData as Record<string, unknown>).toObject() as any
        ),
        ...params
      };
      if (typeof data.reason === 'string') options.reason = data.reason;
      if (data.to && typeof data.to === 'object') options.to = To.fromObject(data.to as Record<string, unknown>).toObject() as ToOptions;
      return new ContextEvent(options);
    }
  }
  
  /**
   * Represents an invitation for an agent to join the conversation
   * This is a bare event with no required parameters
   * 
   * @example
   * ```typescript
   * const inviteEvent = new InviteEvent({
   *   to: { serviceUrl: 'https://example.com/agent' }
   * });
   * ```
   */
  export class InviteEvent extends Event {
    /**
     * Creates a new InviteEvent instance
     * @param options - InviteEvent configuration options
     */
    constructor(options: { to?: ToOptions; reason?: string } = {}) {
      const baseOptions: BaseEventOptions = { eventType: 'invite', parameters: {} };
      if (options.to !== undefined) baseOptions.to = options.to;
      if (options.reason !== undefined) baseOptions.reason = options.reason;
      super(baseOptions);
    }
  
    static fromObject(data: Record<string, unknown>): InviteEvent {
      const options: { to?: ToOptions; reason?: string } = {};
      if (data.to && typeof data.to === 'object') options.to = To.fromObject(data.to as Record<string, unknown>).toObject() as ToOptions;
      if (typeof data.reason === 'string') options.reason = data.reason;
      return new InviteEvent(options);
    }
  }
  
  /**
   * Represents removing an agent from the conversation
   * Supports reason tokens for why the agent is being uninvited
   * 
   * @example
   * ```typescript
   * const uninviteEvent = new UninviteEvent({
   *   to: { speakerUri: 'tag:example.com,2025:agent1' },
   *   reason: '@timedOut'
   * });
   * ```
   */
  export class UninviteEvent extends Event {
    /**
     * Creates a new UninviteEvent instance
     * @param options - UninviteEvent configuration options
     */
    constructor(options: { to?: ToOptions; reason?: string } = {}) {
      const baseOptions: BaseEventOptions = { eventType: 'uninvite', parameters: {} };
      if (options.to !== undefined) baseOptions.to = options.to;
      if (options.reason !== undefined) baseOptions.reason = options.reason;
      super(baseOptions);
    }
  
    static fromObject(data: Record<string, unknown>): UninviteEvent {
      const options: { to?: ToOptions; reason?: string } = {};
      if (data.to && typeof data.to === 'object') options.to = To.fromObject(data.to as Record<string, unknown>).toObject() as ToOptions;
      if (typeof data.reason === 'string') options.reason = data.reason;
      return new UninviteEvent(options);
    }
  }
  
  /**
   * Represents declining an invitation to join the conversation
   * Sent in response to an invite event
   * 
   * @example
   * ```typescript
   * const declineEvent = new DeclineInviteEvent({
   *   to: { speakerUri: 'tag:example.com,2025:convener' },
   *   reason: '@unavailable'
   * });
   * ```
   */
  export class DeclineInviteEvent extends Event {
    /**
     * Creates a new DeclineInviteEvent instance
     * @param options - DeclineInviteEvent configuration options
     */
    constructor(options: { to?: ToOptions; reason?: string } = {}) {
      const baseOptions: BaseEventOptions = { eventType: 'declineInvite', parameters: {} };
      if (options.to !== undefined) baseOptions.to = options.to;
      if (options.reason !== undefined) baseOptions.reason = options.reason;
      super(baseOptions);
    }
  
    static fromObject(data: Record<string, unknown>): DeclineInviteEvent {
      const options: { to?: ToOptions; reason?: string } = {};
      if (data.to && typeof data.to === 'object') options.to = To.fromObject(data.to as Record<string, unknown>).toObject() as ToOptions;
      if (typeof data.reason === 'string') options.reason = data.reason;
      return new DeclineInviteEvent(options);
    }
  }
  
  /**
   * Represents an agent leaving the conversation
   * This is a bare event with no required parameters
   * 
   * @example
   * ```typescript
   * const byeEvent = new ByeEvent({
   *   reason: 'Task completed'
   * });
   * ```
   */
  export class ByeEvent extends Event {
    /**
     * Creates a new ByeEvent instance
     * @param options - ByeEvent configuration options
     */
    constructor(options: { to?: ToOptions; reason?: string } = {}) {
      const baseOptions: BaseEventOptions = { eventType: 'bye', parameters: {} };
      if (options.to !== undefined) baseOptions.to = options.to;
      if (options.reason !== undefined) baseOptions.reason = options.reason;
      super(baseOptions);
    }
  
    static fromObject(data: Record<string, unknown>): ByeEvent {
      const options: { to?: ToOptions; reason?: string } = {};
      if (data.to && typeof data.to === 'object') options.to = To.fromObject(data.to as Record<string, unknown>).toObject() as ToOptions;
      if (typeof data.reason === 'string') options.reason = data.reason;
      return new ByeEvent(options);
    }
  }
  
  /**
   * Represents a request for agent manifests
   * Used for agent discovery and capability determination
   * 
   * @example
   * ```typescript
   * const getManifestsEvent = new GetManifestsEvent({
   *   to: { serviceUrl: 'https://example.com/discovery-agent' },
   *   recommendScope: 'external'
   * });
   * ```
   */
  export class GetManifestsEvent extends Event {
    readonly recommendScope: RecommendScope;
  
    /**
     * Creates a new GetManifestsEvent instance
     * @param options - GetManifestsEvent configuration options
     */
    constructor(options: GetManifestsEventOptions) {
      const { recommendScope = 'internal', to, reason } = options;
  
      const baseOptions: BaseEventOptions = { eventType: 'getManifests', parameters: { recommendScope } };
      if (to !== undefined) baseOptions.to = to;
      if (reason !== undefined) baseOptions.reason = reason;
      super(baseOptions);
  
      this.recommendScope = recommendScope;
    }
  
    static fromObject(data: Record<string, unknown>): GetManifestsEvent {
      const recommendScope = (data.parameters as any)?.recommendScope as RecommendScope ?? 'internal';
      const options: GetManifestsEventOptions = { recommendScope };
      if (typeof data.reason === 'string') options.reason = data.reason;
      if (data.to && typeof data.to === 'object') options.to = To.fromObject(data.to as Record<string, unknown>).toObject() as ToOptions;
      return new GetManifestsEvent(options);
    }
  }
  
  /**
   * Represents publishing agent manifests
   * Contains arrays of servicing and discovery manifests
   * 
   * @example
   * ```typescript
   * const publishEvent = new PublishManifestsEvent({
   *   servicingManifests: [{
   *     identification: {
   *       speakerUri: 'tag:example.com,2025:weather-bot',
   *       serviceUrl: 'https://example.com/weather'
   *     },
   *     capabilities: []
   *   }],
   *   discoveryManifests: []
   * });
   * ```
   */
  export class PublishManifestsEvent extends Event {
    readonly servicingManifests: readonly Manifest[];
    readonly discoveryManifests: readonly Manifest[];
  
    /**
     * Creates a new PublishManifestsEvent instance
     * @param options - PublishManifestsEvent configuration options
     */
    constructor(options: PublishManifestsEventOptions) {
      const { servicingManifests = [], discoveryManifests = [], to, reason } = options;
  
      const servicingInstances = servicingManifests.map(manifest => new Manifest(manifest));
      const discoveryInstances = discoveryManifests.map(manifest => new Manifest(manifest));
  
      const baseOptions: BaseEventOptions = { eventType: 'publishManifests', parameters: {
        servicingManifests: servicingInstances.map(m => m.toObject()),
        discoveryManifests: discoveryInstances.map(m => m.toObject())
      } };
      if (to !== undefined) baseOptions.to = to;
      if (reason !== undefined) baseOptions.reason = reason;
      super(baseOptions);
  
      this.servicingManifests = Object.freeze(servicingInstances);
      this.discoveryManifests = Object.freeze(discoveryInstances);
    }
  
    static fromObject(data: Record<string, unknown>): PublishManifestsEvent {
      const params = (data.parameters as Record<string, unknown>) || {};
      const options: PublishManifestsEventOptions = {
        servicingManifests: Array.isArray(params.servicingManifests) ? params.servicingManifests : [],
        discoveryManifests: Array.isArray(params.discoveryManifests) ? params.discoveryManifests : []
      };
      if (typeof data.reason === 'string') options.reason = data.reason;
      if (data.to && typeof data.to === 'object') options.to = To.fromObject(data.to as Record<string, unknown>).toObject() as ToOptions;
      return new PublishManifestsEvent(options);
    }
  }
  
  /**
   * Represents a request for the conversational floor
   * Used in multi-party conversations for floor management
   * 
   * @example
   * ```typescript
   * const requestFloorEvent = new RequestFloorEvent({
   *   to: { speakerUri: 'tag:example.com,2025:convener' },
   *   reason: 'Need to add information'
   * });
   * ```
   */
  export class RequestFloorEvent extends Event {
    /**
     * Creates a new RequestFloorEvent instance
     * @param options - RequestFloorEvent configuration options
     */
    constructor(options: { to?: ToOptions; reason?: string } = {}) {
      const baseOptions: BaseEventOptions = { eventType: 'requestFloor', parameters: {} };
      if (options.to !== undefined) baseOptions.to = options.to;
      if (options.reason !== undefined) baseOptions.reason = options.reason;
      super(baseOptions);
    }
  
    static fromObject(data: Record<string, unknown>): RequestFloorEvent {
      const options: { to?: ToOptions; reason?: string } = {};
      if (data.to && typeof data.to === 'object') options.to = To.fromObject(data.to as Record<string, unknown>).toObject() as ToOptions;
      if (typeof data.reason === 'string') options.reason = data.reason;
      return new RequestFloorEvent(options);
    }
  }
  
  /**
   * Represents granting the conversational floor to an agent
   * Used by convener agents to manage multi-party conversations
   * 
   * @example
   * ```typescript
   * const grantFloorEvent = new GrantFloorEvent({
   *   to: { speakerUri: 'tag:example.com,2025:agent1' }
   * });
   * ```
   */
  export class GrantFloorEvent extends Event {
    /**
     * Creates a new GrantFloorEvent instance
     * @param options - GrantFloorEvent configuration options
     */
    constructor(options: { to?: ToOptions; reason?: string } = {}) {
      const baseOptions: BaseEventOptions = { eventType: 'grantFloor', parameters: {} };
      if (options.to !== undefined) baseOptions.to = options.to;
      if (options.reason !== undefined) baseOptions.reason = options.reason;
      super(baseOptions);
    }
  
    static fromObject(data: Record<string, unknown>): GrantFloorEvent {
      const options: { to?: ToOptions; reason?: string } = {};
      if (data.to && typeof data.to === 'object') options.to = To.fromObject(data.to as Record<string, unknown>).toObject() as ToOptions;
      if (typeof data.reason === 'string') options.reason = data.reason;
      return new GrantFloorEvent(options);
    }
  }
  
  /**
   * Represents revoking the conversational floor from an agent
   * Used by convener agents with special reason tokens
   * 
   * @example
   * ```typescript
   * const revokeFloorEvent = new RevokeFloorEvent({
   *   to: { speakerUri: 'tag:example.com,2025:agent1' },
   *   reason: '@timedOut'
   * });
   * ```
   */
  export class RevokeFloorEvent extends Event {
    /**
     * Creates a new RevokeFloorEvent instance
     * @param options - RevokeFloorEvent configuration options
     */
    constructor(options: { to?: ToOptions; reason?: string } = {}) {
      const baseOptions: BaseEventOptions = { eventType: 'revokeFloor', parameters: {} };
      if (options.to !== undefined) baseOptions.to = options.to;
      if (options.reason !== undefined) baseOptions.reason = options.reason;
      super(baseOptions);
    }
  
    static fromObject(data: Record<string, unknown>): RevokeFloorEvent {
      const options: { to?: ToOptions; reason?: string } = {};
      if (data.to && typeof data.to === 'object') options.to = To.fromObject(data.to as Record<string, unknown>).toObject() as ToOptions;
      if (typeof data.reason === 'string') options.reason = data.reason;
      return new RevokeFloorEvent(options);
    }
  }
  
  /**
   * Represents yielding the conversational floor
   * Sent by agents to indicate they no longer wish to speak
   * 
   * @example
   * ```typescript
   * const yieldFloorEvent = new YieldFloorEvent({
   *   reason: '@complete'
   * });
   * ```
   */
  export class YieldFloorEvent extends Event {
    /**
     * Creates a new YieldFloorEvent instance
     * @param options - YieldFloorEvent configuration options
     */
    constructor(options: { to?: ToOptions; reason?: string } = {}) {
      const baseOptions: BaseEventOptions = { eventType: 'yieldFloor', parameters: {} };
      if (options.to !== undefined) baseOptions.to = options.to;
      if (options.reason !== undefined) baseOptions.reason = options.reason;
      super(baseOptions);
    }
  
    static fromObject(data: Record<string, unknown>): YieldFloorEvent {
      const options: { to?: ToOptions; reason?: string } = {};
      if (data.to && typeof data.to === 'object') options.to = To.fromObject(data.to as Record<string, unknown>).toObject() as ToOptions;
      if (typeof data.reason === 'string') options.reason = data.reason;
      return new YieldFloorEvent(options);
    }
  }
  
  /**
   * Event factory function to create appropriate event instances from generic event data
   * Automatically determines the correct event class based on eventType
   * 
   * @param data - Raw event data object
   * @returns Appropriate Event instance
   * @throws Error if eventType is unknown
   * 
   * @example
   * ```typescript
   * const eventData = {
   *   eventType: 'utterance',
   *   parameters: { dialogEvent: {...} }
   * };
   * const event = createEvent(eventData); // Returns UtteranceEvent instance
   * ```
   */
  export function createEvent(data: Record<string, unknown>): Event {
    const eventType = data.eventType as string;
  
    switch (eventType) {
      case 'utterance':
        return UtteranceEvent.fromObject(data);
      case 'context':
        return ContextEvent.fromObject(data);
      case 'invite':
        return InviteEvent.fromObject(data);
      case 'uninvite':
        return UninviteEvent.fromObject(data);
      case 'declineInvite':
        return DeclineInviteEvent.fromObject(data);
      case 'bye':
        return ByeEvent.fromObject(data);
      case 'getManifests':
        return GetManifestsEvent.fromObject(data);
      case 'publishManifests':
        return PublishManifestsEvent.fromObject(data);
      case 'requestFloor':
        return RequestFloorEvent.fromObject(data);
      case 'grantFloor':
        return GrantFloorEvent.fromObject(data);
      case 'revokeFloor':
        return RevokeFloorEvent.fromObject(data);
      case 'yieldFloor':
        return YieldFloorEvent.fromObject(data);
      default:
        throw new Error(`Unknown event type: ${eventType}`);
    }
  }
  
  /**
   * Type guard to check if an event is an UtteranceEvent
   */
  export function isUtteranceEvent(event: Event): event is UtteranceEvent {
    return event.eventType === 'utterance';
  }
  
  /**
   * Type guard to check if an event is a ContextEvent
   */
  export function isContextEvent(event: Event): event is ContextEvent {
    return event.eventType === 'context';
  }
  
  /**
   * Type guard to check if an event is an InviteEvent
   */
  export function isInviteEvent(event: Event): event is InviteEvent {
    return event.eventType === 'invite';
  }
  
  /**
   * Type guard to check if an event is an UninviteEvent
   */
  export function isUninviteEvent(event: Event): event is UninviteEvent {
    return event.eventType === 'uninvite';
  }
  
  /**
   * Type guard to check if an event is a DeclineInviteEvent
   */
  export function isDeclineInviteEvent(event: Event): event is DeclineInviteEvent {
    return event.eventType === 'declineInvite';
  }
  
  /**
   * Type guard to check if an event is a ByeEvent
   */
  export function isByeEvent(event: Event): event is ByeEvent {
    return event.eventType === 'bye';
  }
  
  /**
   * Type guard to check if an event is a GetManifestsEvent
   */
  export function isGetManifestsEvent(event: Event): event is GetManifestsEvent {
    return event.eventType === 'getManifests';
  }
  
  /**
   * Type guard to check if an event is a PublishManifestsEvent
   */
  export function isPublishManifestsEvent(event: Event): event is PublishManifestsEvent {
    return event.eventType === 'publishManifests';
  }
  
  /**
   * Type guard to check if an event is a RequestFloorEvent
   */
  export function isRequestFloorEvent(event: Event): event is RequestFloorEvent {
    return event.eventType === 'requestFloor';
  }
  
  /**
   * Type guard to check if an event is a GrantFloorEvent
   */
  export function isGrantFloorEvent(event: Event): event is GrantFloorEvent {
    return event.eventType === 'grantFloor';
  }
  
  /**
   * Type guard to check if an event is a RevokeFloorEvent
   */
  export function isRevokeFloorEvent(event: Event): event is RevokeFloorEvent {
    return event.eventType === 'revokeFloor';
  }
  
  /**
   * Type guard to check if an event is a YieldFloorEvent
   */
  export function isYieldFloorEvent(event: Event): event is YieldFloorEvent {
    return event.eventType === 'yieldFloor';
  }

export { Event };