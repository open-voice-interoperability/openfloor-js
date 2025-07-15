import { Envelope, Event } from '../src/envelope';
import { EventType } from '../src/types';
import { validateEnvelope } from '../src/validation';

describe('OFP Integration Flows', () => {
  it('validates discovery flow: getManifests → publishManifests', () => {
    // getManifests envelope
    const getEnv = new Envelope({
      schema: { version: '1.0.0' },
      conversation: { id: 'conv-1' },
      sender: { speakerUri: 'tag:example.com,2025:fm-1' },
      events: [
        { eventType: 'getManifests' as EventType, to: { speakerUri: 'tag:example.com,2025:discovery-agent' } }
      ]
    });
    const getResult = validateEnvelope({ openFloor: getEnv.toObject() });
    expect(getResult.valid).toBe(true);

    // publishManifest envelope (response)
    const publishEnv = new Envelope({
      schema: { version: '1.0.0' },
      conversation: { id: 'conv-1' },
      sender: { speakerUri: 'tag:example.com,2025:discovery-agent' },
      events: [
        {
          eventType: 'publishManifest' as EventType,
          to: { speakerUri: 'tag:example.com,2025:fm-1' },
          parameters: {
            servicingManifests: [
              {
                identification: {
                  speakerUri: 'tag:example.com,2025:agent-2',
                  serviceUrl: 'https://agent2.example.com',
                  organization: 'ExampleOrg',
                  conversationalName: 'Agent2',
                  synopsis: 'Handles weather.'
                },
                capabilities: [
                  { keyphrases: ['weather'], descriptions: ['Provides weather.'] }
                ]
              }
            ]
          }
        }
      ]
    });
    const publishResult = validateEnvelope({ openFloor: publishEnv.toObject() });
    expect(publishResult.valid).toBe(true);
  });

  it('simulates a multi-turn conversation with floor passing', () => {
    // 1. User utterance
    const utterEnv = new Envelope({
      schema: { version: '1.0.0' },
      conversation: { id: 'conv-2' },
      sender: { speakerUri: 'tag:example.com,2025:user-1' },
      events: [
        {
          eventType: 'utterance' as EventType,
          parameters: {
            dialogEvent: {
              speakerUri: 'tag:example.com,2025:user-1',
              features: { text: { mimeType: 'text/plain', tokens: [{ value: 'What is the weather?' }] } }
            }
          }
        }
      ]
    });
    expect(validateEnvelope({ openFloor: utterEnv.toObject() }).valid).toBe(true);

    // 2. Floor manager grants floor to agent
    const grantEnv = new Envelope({
      schema: { version: '1.0.0' },
      conversation: { id: 'conv-2' },
      sender: { speakerUri: 'tag:example.com,2025:fm-1' },
      events: [
        { eventType: 'grantFloor' as EventType, to: { speakerUri: 'tag:example.com,2025:agent-2' } }
      ]
    });
    expect(validateEnvelope({ openFloor: grantEnv.toObject() }).valid).toBe(true);

    // 3. Agent responds with utterance
    const agentUtterEnv = new Envelope({
      schema: { version: '1.0.0' },
      conversation: { id: 'conv-2' },
      sender: { speakerUri: 'tag:example.com,2025:agent-2' },
      events: [
        {
          eventType: 'utterance' as EventType,
          parameters: {
            dialogEvent: {
              speakerUri: 'tag:example.com,2025:agent-2',
              features: { text: { mimeType: 'text/plain', tokens: [{ value: 'It is sunny.' }] } }
            }
          }
        }
      ]
    });
    expect(validateEnvelope({ openFloor: agentUtterEnv.toObject() }).valid).toBe(true);

    // 4. Agent yields floor
    const yieldEnv = new Envelope({
      schema: { version: '1.0.0' },
      conversation: { id: 'conv-2' },
      sender: { speakerUri: 'tag:example.com,2025:agent-2' },
      events: [
        { eventType: 'yieldFloor' as EventType }
      ]
    });
    expect(validateEnvelope({ openFloor: yieldEnv.toObject() }).valid).toBe(true);

    // 5. Agent leaves (bye)
    const byeEnv = new Envelope({
      schema: { version: '1.0.0' },
      conversation: { id: 'conv-2' },
      sender: { speakerUri: 'tag:example.com,2025:agent-2' },
      events: [
        { eventType: 'bye' as EventType }
      ]
    });
    expect(validateEnvelope({ openFloor: byeEnv.toObject() }).valid).toBe(true);
  });
});
