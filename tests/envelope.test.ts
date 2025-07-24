import { Envelope } from '../src/envelope';
import { validateEnvelope } from '../src/validation';
import { EventType } from '../src/types';
import { Identification, Manifest, Capability } from '../src/envelope';
import { DialogEvent } from '../src/dialog-event';

describe('OFP Envelope Creation and Validation', () => {
  const schema = { version: '1.0.0' };
  const conversation = { id: 'conv-1' };
  const sender = { speakerUri: 'tag:example.com,2025:user-1' };

  it('creates and validates an utterance envelope', () => {
    const dialogEvent = new DialogEvent({
      id: 'de-1',
      speakerUri: 'tag:example.com,2025:user-1',
      span: { startTime: new Date('2025-01-01T00:00:00Z') },
      features: {
        text: { mimeType: 'text/plain', tokens: [{ value: 'Hello world!' }] }
      }
    });
    const events = [
      { eventType: 'utterance' as EventType, parameters: { dialogEvent: dialogEvent.toObject() } }
    ];
    const env = new Envelope({ schema, conversation, sender, events });
    const result = validateEnvelope({ openFloor: env.toObject() });
    expect(result.valid).toBe(true);
    expect(JSON.parse(JSON.stringify(env.toObject()))).toEqual(env.toObject()); // round-trip
  });

  it('creates and validates an invite envelope', () => {
    const events = [
      { eventType: 'invite' as EventType, to: { speakerUri: 'tag:example.com,2025:agent-2' }, parameters: {} }
    ];
    const env = new Envelope({ schema, conversation, sender, events });
    const result = validateEnvelope({ openFloor: env.toObject() });
    expect(result.valid).toBe(true);
  });

  it('creates and validates an uninvite envelope', () => {
    const events = [
      { eventType: 'uninvite' as EventType, to: { speakerUri: 'tag:example.com,2025:agent-2' }, parameters: {} }
    ];
    const env = new Envelope({ schema, conversation, sender, events });
    const result = validateEnvelope({ openFloor: env.toObject() });
    expect(result.valid).toBe(true);
  });

  it('creates and validates a bye envelope', () => {
    const events = [
      { eventType: 'bye' as EventType, parameters: {} }
    ];
    const env = new Envelope({ schema, conversation, sender, events });
    const result = validateEnvelope({ openFloor: env.toObject() });
    expect(result.valid).toBe(true);
  });

  it('creates and validates a getManifests envelope', () => {
    const events = [
      { eventType: 'getManifests' as EventType, to: { speakerUri: 'tag:example.com,2025:discovery-agent' }, parameters: {} }
    ];
    const env = new Envelope({ schema, conversation, sender, events });
    const result = validateEnvelope({ openFloor: env.toObject() });
    expect(result.valid).toBe(true);
  });

  it('creates and validates a publishManifests envelope', () => {
    const idOptions = {
      speakerUri: 'tag:example.com,2025:agent-2',
      serviceUrl: 'https://agent2',
      organization: 'TestOrg',
      conversationalName: 'Agent2',
      synopsis: 'Test agent',
      role: 'Test'
    };
    const capOptions = {
      keyphrases: ['test'],
      descriptions: ['Test capability.'],
      supportedLayers: { input: ['text'], output: ['text'] }
    };
    const id = new Identification(idOptions);
    const cap = new Capability(capOptions);
    const manifests = [
      new Manifest({
        identification: idOptions,
        capabilities: [capOptions]
      })
    ];
    const events = [
      { eventType: 'publishManifests' as EventType, parameters: { servicingManifests: manifests.map(m => m.toObject()) } }
    ];
    const env = new Envelope({ schema, conversation, sender, events });
    const result = validateEnvelope({ openFloor: env.toObject() });
    expect(result.valid).toBe(true);
  });

  it('creates and validates a requestFloor envelope', () => {
    const events = [
      { eventType: 'requestFloor' as EventType, to: { speakerUri: 'tag:example.com,2025:fm-1' }, parameters: {} }
    ];
    const env = new Envelope({ schema, conversation, sender, events });
    const result = validateEnvelope({ openFloor: env.toObject() });
    expect(result.valid).toBe(true);
  });

  it('creates and validates a grantFloor envelope', () => {
    const events = [
      { eventType: 'grantFloor' as EventType, to: { speakerUri: 'tag:example.com,2025:agent-2' }, parameters: {} }
    ];
    const env = new Envelope({ schema, conversation, sender, events });
    const result = validateEnvelope({ openFloor: env.toObject() });
    expect(result.valid).toBe(true);
  });

  it('creates and validates a revokeFloor envelope', () => {
    const events = [
      { eventType: 'revokeFloor' as EventType, to: { speakerUri: 'tag:example.com,2025:agent-2' }, parameters: {} }
    ];
    const env = new Envelope({ schema, conversation, sender, events });
    const result = validateEnvelope({ openFloor: env.toObject() });
    expect(result.valid).toBe(true);
  });

  it('creates and validates a yieldFloor envelope', () => {
    const events = [
      { eventType: 'yieldFloor' as EventType, parameters: {} }
    ];
    const env = new Envelope({ schema, conversation, sender, events });
    const result = validateEnvelope({ openFloor: env.toObject() });
    expect(result.valid).toBe(true);
  });
});
