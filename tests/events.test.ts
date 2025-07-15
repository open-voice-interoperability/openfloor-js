import { Event } from '../src/envelope';
import { EventType } from '../src/types';

describe('OFP Event Construction and Routing', () => {
  it('constructs a minimal utterance event', () => {
    const event = new Event({
      eventType: 'utterance' as EventType,
      parameters: {
        dialogEvent: {
          speakerUri: 'tag:example.com,2025:user-1',
          features: {
            text: { mimeType: 'text/plain', tokens: [{ value: 'Hello' }] }
          }
        }
      }
    });
    expect(event.toObject().eventType).toBe('utterance');
  });

  it('constructs a minimal context event', () => {
    const event = new Event({
      eventType: 'context' as EventType,
      parameters: {
        dialogHistory: []
      }
    });
    expect(event.toObject().eventType).toBe('context');
  });

  it('constructs a minimal invite event', () => {
    const event = new Event({
      eventType: 'invite' as EventType,
      to: { speakerUri: 'tag:example.com,2025:agent-2' }
    });
    expect(event.toObject().eventType).toBe('invite');
    expect((event.toObject().to as any).speakerUri).toBe('tag:example.com,2025:agent-2');
  });

  it('constructs a minimal uninvite event', () => {
    const event = new Event({
      eventType: 'uninvite' as EventType,
      to: { speakerUri: 'tag:example.com,2025:agent-2' }
    });
    expect(event.toObject().eventType).toBe('uninvite');
  });

  it('constructs a minimal declineInvite event', () => {
    const event = new Event({
      eventType: 'declineInvite' as EventType,
      to: { speakerUri: 'tag:example.com,2025:fm-1' },
      reason: '@unavailable'
    });
    expect(event.toObject().eventType).toBe('declineInvite');
    expect(event.toObject().reason).toBe('@unavailable');
  });

  it('constructs a minimal bye event', () => {
    const event = new Event({
      eventType: 'bye' as EventType
    });
    expect(event.toObject().eventType).toBe('bye');
  });

  it('constructs a minimal getManifests event', () => {
    const event = new Event({
      eventType: 'getManifests' as EventType,
      to: { speakerUri: 'tag:example.com,2025:discovery-agent' }
    });
    expect(event.toObject().eventType).toBe('getManifests');
  });

  it('constructs a minimal publishManifest event', () => {
    const event = new Event({
      eventType: 'publishManifest' as EventType,
      parameters: { servicingManifests: [] }
    });
    expect(event.toObject().eventType).toBe('publishManifest');
  });

  it('constructs a minimal requestFloor event', () => {
    const event = new Event({
      eventType: 'requestFloor' as EventType,
      to: { speakerUri: 'tag:example.com,2025:fm-1' }
    });
    expect(event.toObject().eventType).toBe('requestFloor');
  });

  it('constructs a minimal grantFloor event', () => {
    const event = new Event({
      eventType: 'grantFloor' as EventType,
      to: { speakerUri: 'tag:example.com,2025:agent-2' }
    });
    expect(event.toObject().eventType).toBe('grantFloor');
  });

  it('constructs a minimal revokeFloor event', () => {
    const event = new Event({
      eventType: 'revokeFloor' as EventType,
      to: { speakerUri: 'tag:example.com,2025:agent-2' },
      reason: '@override'
    });
    expect(event.toObject().eventType).toBe('revokeFloor');
    expect(event.toObject().reason).toBe('@override');
  });

  it('constructs a minimal yieldFloor event', () => {
    const event = new Event({
      eventType: 'yieldFloor' as EventType
    });
    expect(event.toObject().eventType).toBe('yieldFloor');
  });

  it('constructs an event with a private to field', () => {
    const event = new Event({
      eventType: 'utterance' as EventType,
      to: { speakerUri: 'tag:example.com,2025:agent-2', private: true },
      parameters: { dialogEvent: { speakerUri: 'tag:example.com,2025:user-1', features: { text: { mimeType: 'text/plain', tokens: [{ value: 'Secret' }] } } } }
    });
    expect((event.toObject().to as any).private).toBe(true);
  });

  it('throws if eventType is missing', () => {
    // @ts-expect-error
    expect(() => new Event({})).toThrow();
  });

  it('throws if eventType is invalid', () => {
    // @ts-expect-error
    expect(() => new Event({ eventType: 'notARealType' })).toThrow();
  });
});
