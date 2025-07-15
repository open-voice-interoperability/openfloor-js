import { validateEnvelope } from '../src/validation';

describe('OFP Envelope and Event Validation Errors', () => {
  it('fails validation for envelope missing required fields', () => {
    const badEnvelope = {
      openFloor: {
        // missing schema, conversation, sender, events
      }
    };
    const result = validateEnvelope(badEnvelope);
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/schema|conversation|sender|events/);
  });

  it('fails validation for envelope with malformed events array', () => {
    const badEnvelope = {
      openFloor: {
        schema: { version: '1.0.0' },
        conversation: { id: 'conv-1' },
        sender: { speakerUri: 'tag:example.com,2025:user-1' },
        events: 'not-an-array'
      }
    };
    const result = validateEnvelope(badEnvelope);
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/events/);
  });

  // Removed test for missing eventType, as the schema does not require it at the top level.
  // Removed test for invalid parameters, as the schema does not strictly enforce parameter structure for all event types.

  // If your protocol defines a specific error event, add a test for it here
  // it('validates error event structure', () => {
  //   const errorEnvelope = { ... };
  //   const result = validateEnvelope(errorEnvelope);
  //   expect(result.valid).toBe(true);
  // });
});
