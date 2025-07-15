/**
 * @fileoverview Agent implementation for the Open Floor Protocol
 * Implements agent behaviors from Section 2 of the Inter-Agent Message Specification v1.0.0
 * @author Open Voice Interoperability Initiative
 * @version 0.0.1
 * @license Apache-2.0
 */

import { AgentEventHandlers, ManifestOptions, ToOptions } from './types';
import { Envelope, Manifest, Conversation, Sender } from './envelope';
import {
  Event,
  UtteranceEvent,
  ContextEvent,
  InviteEvent,
  UninviteEvent,
  GetManifestsEvent,
  PublishManifestEvent,
  GrantFloorEvent,
  RevokeFloorEvent,
  isUtteranceEvent,
  isContextEvent,
  isInviteEvent,
  isUninviteEvent,
  isByeEvent,
  isGetManifestsEvent,
  isRequestFloorEvent,
  isGrantFloorEvent,
  isRevokeFloorEvent
} from './events';
import { createValidationError, hasRequiredProperties } from './utils';

/**
 * Interface for event metadata used in agent processing
 */
interface EventMetadata {
  /** Whether this event is addressed to this agent */
  addressedToMe: boolean;
}

/**
 * Base class for Open Floor Protocol agents
 * Provides event handling infrastructure and basic agent behaviors
 * 
 * @example
 * ```typescript
 * class MyAgent extends OpenFloorAgent {
 *   constructor(manifest) {
 *     super(manifest);
 *     this.on('utterance', this.handleUtterance.bind(this));
 *   }
 * 
 *   async handleUtterance(event, envelope, outEnvelope) {
 *     // Handle utterance event
 *   }
 * }
 * ```
 */
export abstract class OpenFloorAgent extends EventTarget {
  protected readonly _manifest: Manifest;

  /**
   * Creates a new OpenFloorAgent instance
   * @param manifest - Agent manifest defining capabilities and identification
   * @throws Error if manifest is invalid
   */
  constructor(manifest: ManifestOptions) {
    super();
    
    if (!manifest) {
      throw new Error(createValidationError(
        'OpenFloorAgent.manifest', 
        manifest, 
        'valid ManifestOptions object'
      ));
    }

    this._manifest = new Manifest(manifest);
  }

  /**
   * Get the agent's speaker URI from the manifest
   */
  get speakerUri(): string {
    return this._manifest.identification.speakerUri;
  }

  /**
   * Get the agent's service URL from the manifest
   */
  get serviceUrl(): string {
    return this._manifest.identification.serviceUrl;
  }

  /**
   * Get the agent's manifest
   */
  get manifest(): Manifest {
    return this._manifest;
  }

  /**
   * Process an incoming envelope and generate a response
   * This is the main entry point for agent message processing
   * 
   * @param inEnvelope - Incoming envelope to process
   * @returns Promise resolving to response envelope
   */
  async processEnvelope(inEnvelope: Envelope): Promise<Envelope> {
    // Create response envelope with same schema, conversation, and this agent as sender
    const outEnvelope = new Envelope({
      schema: { version: inEnvelope.schema.version, ...(inEnvelope.schema.url ? { url: inEnvelope.schema.url } : {}) },
      conversation: {
        id: inEnvelope.conversation.id,
        ...(inEnvelope.conversation.conversants && inEnvelope.conversation.conversants.length > 0
          ? {
              conversants: inEnvelope.conversation.conversants.map(c => {
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
      sender: {
        speakerUri: this.speakerUri,
        serviceUrl: this.serviceUrl
      },
      events: []
    });

    // Dispatch envelope event (use a valid key from AgentEventHandlers, e.g., 'onEnvelope')
    await this.dispatchAgentEvent('onEnvelope', { inEnvelope, outEnvelope });

    return outEnvelope;
  }

  /**
   * Add metadata to events indicating whether they are addressed to this agent
   * @param events - Array of events to analyze
   * @returns Array of events with metadata
   */
  protected addMetadata(events: readonly Event[]): Array<[Event, EventMetadata]> {
    return events.map(event => [
      event,
      {
        addressedToMe: (
          !event.to ||
          event.to.speakerUri === this.speakerUri ||
          event.to.serviceUrl === this.serviceUrl
        )
      }
    ]);
  }

  /**
   * Dispatch an agent-specific event
   * @param eventType - Type of event to dispatch
   * @param detail - Event detail data
   */
  protected async dispatchAgentEvent(eventType: string, detail: any): Promise<void> {
    const event = new CustomEvent(`agent:${eventType}`, { detail });
    this.dispatchEvent(event);
  }

  /**
   * Add an event handler for a specific event type
   * @param eventType - Type of event to handle
   * @param handler - Handler function
   */
  on(eventType: keyof AgentEventHandlers, handler: (...args: any[]) => Promise<void>): void {
    this.addEventListener(`agent:${eventType}`, handler as EventListener);
  }

  /**
   * Remove an event handler
   * @param eventType - Type of event
   * @param handler - Handler function to remove
   */
  off(eventType: keyof AgentEventHandlers, handler: (...args: any[]) => Promise<void>): void {
    this.removeEventListener(`agent:${eventType}`, handler as EventListener);
  }
}

/**
 * Bot agent implementation providing default behaviors per specification Section 2.1
 * Handles conversation state and implements minimal required behaviors
 * 
 * @example
 * ```typescript
 * const bot = new BotAgent({
 *   identification: {
 *     speakerUri: 'tag:example.com,2025:bot1',
 *     serviceUrl: 'https://example.com/bot',
 *     organization: 'Example Corp',
 *     conversationalName: 'Assistant'
 *   },
 *   capabilities: []
 * });
 * 
 * const response = await bot.processEnvelope(incomingEnvelope);
 * ```
 */
export class BotAgent extends OpenFloorAgent {
  private _currentContext: ContextEvent[] = [];
  private _activeConversation: Conversation | null = null;
  private _hasFloor: boolean = false;

  /**
   * Creates a new BotAgent instance
   * @param manifest - Agent manifest
   */
  constructor(manifest: ManifestOptions) {
    super(manifest);
    this._setupEventHandlers();
  }

  /**
   * Get current conversation state
   */
  get activeConversation(): Conversation | null {
    return this._activeConversation;
  }

  /**
   * Check if agent currently has the floor
   */
  get hasFloor(): boolean {
    return this._hasFloor;
  }

  /**
   * Get current context events
   */
  get currentContext(): readonly ContextEvent[] {
    return [...this._currentContext];
  }

  /**
   * Set up default event handlers
   */
  private _setupEventHandlers(): void {
    this.on('onEnvelope', this._handleEnvelope.bind(this));
  }

  /**
   * Main envelope processing logic
   */
  private async _handleEnvelope(event: CustomEvent): Promise<void> {
    const { inEnvelope, outEnvelope } = event.detail;
    
    // Clear current context
    this._currentContext = [];

    // Check for conversation conflicts
    if (this._activeConversation && 
        this._activeConversation.id !== inEnvelope.conversation.id) {
      throw new Error('Bot is already in a different conversation');
    }

    // Filter events addressed to this agent
    const eventsWithMetadata = this.addMetadata(inEnvelope.events);
    const myEvents = eventsWithMetadata.filter(([, metadata]) => metadata.addressedToMe);

    // Process events in order
    for (const [eventObj] of myEvents) {
      await this._handleEvent(eventObj, inEnvelope, outEnvelope);
    }
  }

  /**
   * Handle individual events based on type
   */
  private async _handleEvent(event: Event, inEnvelope: Envelope, outEnvelope: Envelope): Promise<void> {
    if (isInviteEvent(event)) {
      await this._handleInvite(event, inEnvelope, outEnvelope);
    } else if (isUtteranceEvent(event)) {
      await this._handleUtterance(event, inEnvelope, outEnvelope);
    } else if (isContextEvent(event)) {
      await this._handleContext(event, inEnvelope, outEnvelope);
    } else if (isUninviteEvent(event)) {
      await this._handleUninvite(event, inEnvelope, outEnvelope);
    } else if (isGrantFloorEvent(event)) {
      await this._handleGrantFloor(event, inEnvelope, outEnvelope);
    } else if (isRevokeFloorEvent(event)) {
      await this._handleRevokeFloor(event, inEnvelope, outEnvelope);
    } else if (isGetManifestsEvent(event)) {
      await this._handleGetManifests(event, inEnvelope, outEnvelope);
    }
    // Other events are ignored per spec Section 2.1
  }

  /**
   * Handle invite events - accept invitation and automatically grant floor
   */
  private async _handleInvite(event: InviteEvent, inEnvelope: Envelope, outEnvelope: Envelope): Promise<void> {
    // Accept invitation
    this._activeConversation = new Conversation({ id: inEnvelope.conversation.id });
    
    // Automatically grant floor (per spec)
    await this._handleGrantFloor(
      new GrantFloorEvent({
        reason: 'Automatic floor grant as a result of invitation'
      }),
      inEnvelope,
      outEnvelope
    );
  }

  /**
   * Handle grant floor events
   */
  private async _handleGrantFloor(event: GrantFloorEvent, inEnvelope: Envelope, outEnvelope: Envelope): Promise<void> {
    this._hasFloor = true;
  }

  /**
   * Handle revoke floor events
   */
  private async _handleRevokeFloor(event: RevokeFloorEvent, inEnvelope: Envelope, outEnvelope: Envelope): Promise<void> {
    this._hasFloor = false;
  }

  /**
   * Handle utterance events - provide default response
   * Subclasses should override this method to provide meaningful responses
   */
  private async _handleUtterance(event: UtteranceEvent, inEnvelope: Envelope, outEnvelope: Envelope): Promise<void> {
    const responseEvent = new UtteranceEvent({
      dialogEvent: {
        speakerUri: this.speakerUri,
        features: {
          text: {
            mimeType: 'text/plain',
            tokens: [{ value: "Sorry! I'm a simple bot that has not been programmed to do anything yet." }]
          }
        }
      }
    });

    // Add to output envelope (mutate the events array)
    (outEnvelope as any)._events = [...outEnvelope.events, responseEvent];
  }

  /**
   * Handle context events - store context for future use
   */
  private async _handleContext(event: ContextEvent, inEnvelope: Envelope, outEnvelope: Envelope): Promise<void> {
    this._currentContext.push(event);
  }

  /**
   * Handle uninvite events - leave conversation
   */
  private async _handleUninvite(event: UninviteEvent, inEnvelope: Envelope, outEnvelope: Envelope): Promise<void> {
    this._activeConversation = null;
    this._hasFloor = false;
  }

  /**
   * Handle getManifests events - return own manifest
   */
  private async _handleGetManifests(event: GetManifestsEvent, inEnvelope: Envelope, outEnvelope: Envelope): Promise<void> {
    const responseEvent = new PublishManifestEvent({
      servicingManifests: [this._manifest.toObject() as any],
      discoveryManifests: []
    });

    // Add to output envelope
    (outEnvelope as any)._events = [...outEnvelope.events, responseEvent];
  }
}

/**
 * Floor manager agent implementation per specification Section 2.2
 * Manages multi-party conversations and event forwarding
 * 
 * @example
 * ```typescript
 * const floorManager = new FloorManager({
 *   identification: {
 *     speakerUri: 'tag:example.com,2025:floor-manager',
 *     serviceUrl: 'https://example.com/floor',
 *     organization: 'Example Corp',
 *     conversationalName: 'Floor Manager'
 *   }
 * });
 * ```
 */
export class FloorManager extends OpenFloorAgent {
  private _activeConversants = new Map<string, Manifest>();
  private _currentSpeaker: string | null = null;

  /**
   * Creates a new FloorManager instance
   * @param manifest - Floor manager manifest
   */
  constructor(manifest: ManifestOptions) {
    super(manifest);
    this._setupEventHandlers();
  }

  /**
   * Get current speaker URI
   */
  get currentSpeaker(): string | null {
    return this._currentSpeaker;
  }

  /**
   * Get list of active conversant URIs
   */
  get activeConversants(): readonly string[] {
    return Array.from(this._activeConversants.keys());
  }

  /**
   * Set up floor manager event handlers
   */
  private _setupEventHandlers(): void {
    this.on('onEnvelope', this._handleEnvelope.bind(this));
  }

  /**
   * Floor manager envelope processing - forwards events as appropriate
   */
  private async _handleEnvelope(event: CustomEvent): Promise<void> {
    const { inEnvelope, outEnvelope } = event.detail;

    // Process each event for forwarding logic
    for (const eventObj of inEnvelope.events) {
      await this._forwardEvent(eventObj, inEnvelope, outEnvelope);
    }
  }

  /**
   * Forward events according to their targeting and floor management rules
   */
  private async _forwardEvent(event: Event, inEnvelope: Envelope, outEnvelope: Envelope): Promise<void> {
    if (isByeEvent(event)) {
      // Remove agent from active conversants
      const senderUri = inEnvelope.sender.speakerUri;
      this._activeConversants.delete(senderUri);
      if (this._currentSpeaker === senderUri) {
        this._currentSpeaker = null;
      }
    } else if (isRequestFloorEvent(event)) {
      // Grant floor automatically (minimal implementation)
      const grantEvent = new GrantFloorEvent({
        to: { speakerUri: inEnvelope.sender.speakerUri }
      });
      (outEnvelope as any)._events = [...outEnvelope.events, grantEvent];
      this._currentSpeaker = inEnvelope.sender.speakerUri;
    }

    (outEnvelope as any)._events = [...outEnvelope.events, event];
  }

  /**
   * Add a conversant to the active conversation
   * @param manifest - Conversant's manifest
   */
  addConversant(manifest: Manifest): void {
    this._activeConversants.set(manifest.identification.speakerUri, manifest);
  }

  /**
   * Remove a conversant from the active conversation
   * @param speakerUri - Speaker URI to remove
   */
  removeConversant(speakerUri: string): void {
    this._activeConversants.delete(speakerUri);
    if (this._currentSpeaker === speakerUri) {
      this._currentSpeaker = null;
    }
  }
}

/**
 * Convener agent with special privileges for managing multi-party conversations
 * Extends BotAgent with floor management capabilities
 * 
 * @example
 * ```typescript
 * const convener = new ConvenerAgent({
 *   identification: {
 *     speakerUri: 'tag:example.com,2025:convener',
 *     serviceUrl: 'https://example.com/convener',
 *     organization: 'Example Corp',
 *     conversationalName: 'Convener'
 *   }
 * });
 * 
 * await convener.grantFloor('tag:example.com,2025:agent1');
 * ```
 */
export class ConvenerAgent extends BotAgent {
  /**
   * Grant the floor to a specific agent
   * @param speakerUri - URI of agent to grant floor to
   * @param reason - Optional reason for granting floor
   * @returns GrantFloorEvent that can be sent
   */
  grantFloor(speakerUri: string, reason?: string): GrantFloorEvent {
    const options: { to?: ToOptions; reason?: string } = { to: { speakerUri } };
    if (reason !== undefined) options.reason = reason;
    return new GrantFloorEvent(options);
  }

  /**
   * Revoke the floor from a specific agent
   * @param speakerUri - URI of agent to revoke floor from
   * @param reason - Reason for revoking floor (should include reason token)
   * @returns RevokeFloorEvent that can be sent
   */
  revokeFloor(speakerUri: string, reason?: string): RevokeFloorEvent {
    const options: { to?: ToOptions; reason?: string } = { to: { speakerUri } };
    if (reason !== undefined) options.reason = reason;
    return new RevokeFloorEvent(options);
  }

  /**
   * Uninvite an agent from the conversation
   * @param speakerUri - URI of agent to uninvite
   * @param reason - Reason for uninviting (should include reason token)
   * @returns UninviteEvent that can be sent
   */
  uninviteAgent(speakerUri: string, reason?: string): UninviteEvent {
    const options: { to?: ToOptions; reason?: string } = { to: { speakerUri } };
    if (reason !== undefined) options.reason = reason;
    return new UninviteEvent(options);
  }

  /**
   * Invite an agent to join the conversation
   * @param serviceUrl - Service URL of agent to invite
   * @param speakerUri - Optional specific speaker URI
   * @param reason - Optional reason for invitation
   * @returns InviteEvent that can be sent
   */
  inviteAgent(serviceUrl: string, speakerUri?: string, reason?: string): InviteEvent {
    const to: ToOptions = { serviceUrl };
    if (speakerUri !== undefined) to.speakerUri = speakerUri;
    const options: { to?: ToOptions; reason?: string } = { to };
    if (reason !== undefined) options.reason = reason;
    return new InviteEvent(options);
  }
}