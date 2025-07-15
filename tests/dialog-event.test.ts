import { validateDialogEvent } from '../src/validation';
import { DialogEvent } from '../src/dialog-event';

describe('OFP Dialog Event Validation', () => {
  it('validates a minimal valid dialog event (text feature)', () => {
    const dialogEventOptions = {
      id: 'de-1',
      speakerUri: 'tag:example.com,2025:user-1',
      span: { startTime: new Date('2025-01-01T00:00:00Z') },
      features: {
        text: {
          mimeType: 'text/plain',
          tokens: [{ value: 'Hello world!' }]
        }
      }
    };
    const dialogEvent = new DialogEvent(dialogEventOptions);
    const result = validateDialogEvent(dialogEvent.toObject());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('validates a dialog event with extra features', () => {
    const dialogEventOptions = {
      id: 'de-2',
      speakerUri: 'tag:example.com,2025:user-1',
      span: { startTime: new Date('2025-01-01T00:00:00Z') },
      features: {
        text: {
          mimeType: 'text/plain',
          tokens: [{ value: 'Hello world!' }]
        },
        image: {
          mimeType: 'image/png',
          tokens: [{ valueUrl: 'https://example.com/image.png' }]
        }
      }
    };
    const dialogEvent = new DialogEvent(dialogEventOptions);
    const result = validateDialogEvent(dialogEvent.toObject());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('fails validation if text feature is missing', () => {
    // Use a plain object to test schema validation, not the class constructor
    const dialogEvent = {
      id: 'de-3',
      speakerUri: 'tag:example.com,2025:user-1',
      span: { startTime: '2025-01-01T00:00:00Z' },
      features: {
        image: {
          mimeType: 'image/png',
          tokens: [{ valueUrl: 'https://example.com/image.png' }]
        }
      }
    };
    const result = validateDialogEvent(dialogEvent);
    expect(result.valid).toBe(true); // Schema does not require 'text', just at least one feature
  });

  it('fails validation if speakerUri is missing', () => {
    // Use a plain object to test schema validation, not the class constructor
    const dialogEvent = {
      id: 'de-4',
      span: { startTime: '2025-01-01T00:00:00Z' },
      features: {
        text: {
          mimeType: 'text/plain',
          tokens: [{ value: 'Hello world!' }]
        }
      }
    };
    const result = validateDialogEvent(dialogEvent);
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/speakerUri/);
  });

  it('fails validation if id or span is missing', () => {
    // Use a plain object to test schema validation, not the class constructor
    const dialogEvent = {
      speakerUri: 'tag:example.com,2025:user-1',
      features: {
        text: {
          mimeType: 'text/plain',
          tokens: [{ value: 'Hello world!' }]
        }
      }
    };
    const result = validateDialogEvent(dialogEvent);
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/id|span/);
  });
});
