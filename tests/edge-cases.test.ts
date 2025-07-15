import { Envelope } from '../src/envelope';
import { EventType } from '../src/types';
import { validateEnvelope } from '../src/validation';
import { DialogEvent } from '../src/dialog-event';

describe('OFP Edge Case Handling', () => {
  it('validates an envelope with multiple simultaneous events', () => {
    const dialogEventOptions = {
      id: 'de-edge-1',
      speakerUri: 'tag:example.com,2025:user-1',
      span: { startTime: new Date('2025-01-01T00:00:00Z') },
      features: {
        text: { mimeType: 'text/plain', tokens: [{ value: 'Hello' }] }
      }
    };
    const dialogEvent = new DialogEvent(dialogEventOptions);
    const env = new Envelope({
      schema: { version: '1.0.0' },
      conversation: { id: 'conv-edge-2' },
      sender: { speakerUri: 'tag:example.com,2025:user-1' },
      events: [
        {
          eventType: 'utterance' as EventType,
          parameters: { dialogEvent: dialogEvent.toObject() }
        },
        {
          eventType: 'context' as EventType,
          parameters: { dialogHistory: [] }
        }
      ]
    });
    const result = validateEnvelope({ openFloor: env.toObject() });
    expect(result.valid).toBe(true);
  });

  it('validates envelope with empty conversants array (should be valid)', () => {
    const dialogEventOptions = {
      id: 'de-edge-2',
      speakerUri: 'tag:example.com,2025:user-1',
      span: { startTime: new Date('2025-01-01T00:00:00Z') },
      features: {
        text: { mimeType: 'text/plain', tokens: [{ value: 'Hello' }] }
      }
    };
    const dialogEvent = new DialogEvent(dialogEventOptions);
    const env = new Envelope({
      schema: { version: '1.0.0' },
      conversation: { id: 'conv-edge-4', conversants: [] },
      sender: { speakerUri: 'tag:example.com,2025:user-1' },
      events: [
        {
          eventType: 'utterance' as EventType,
          parameters: { dialogEvent: dialogEvent.toObject() }
        }
      ]
    });
    const result = validateEnvelope({ openFloor: env.toObject() });
    expect(result.valid).toBe(true);
  });
}); 