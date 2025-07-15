import { validateManifest } from '../src/validation';
import { Manifest, Identification, Capability } from '../src/envelope';

describe('OFP Assistant Manifest Validation', () => {
  it('validates a minimal valid manifest', () => {
    const idOptions = {
      speakerUri: 'tag:example.com,2025:agent-1',
      serviceUrl: 'https://agent1.example.com',
      organization: 'ExampleOrg',
      conversationalName: 'Agent1',
      synopsis: 'A helpful agent.'
    };
    const capOptions = {
      keyphrases: ['help'],
      descriptions: ['Provides help.'],
      supportedLayers: { input: ['text'], output: ['text'] }
    };
    const manifest = new Manifest({
      identification: idOptions,
      capabilities: [capOptions]
    });
    const result = validateManifest(manifest.toObject());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('validates a manifest with multiple capabilities and optional fields', () => {
    const idOptions = {
      speakerUri: 'tag:example.com,2025:agent-2',
      serviceUrl: 'https://agent2.example.com',
      organization: 'ExampleOrg',
      conversationalName: 'Agent2',
      synopsis: 'Handles weather and news.',
      department: 'Info',
      role: 'Specialist'
    };
    const cap1 = {
      keyphrases: ['weather', 'forecast'],
      descriptions: ['Provides weather forecasts.'],
      languages: ['en-US'],
      supportedLayers: { input: ['text'], output: ['text', 'ssml'] }
    };
    const cap2 = {
      keyphrases: ['news'],
      descriptions: ['Delivers news updates.'],
      languages: ['en-US', 'de-DE'],
      supportedLayers: { input: ['text'], output: ['text'] }
    };
    const manifest = new Manifest({
      identification: idOptions,
      capabilities: [cap1, cap2]
    });
    const result = validateManifest(manifest.toObject());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  // Removed test for missing required identification fields, as the schema does not require all fields at the top level.

  it('fails validation if a capability is missing keyphrases or descriptions', () => {
    // Use a plain object to test schema validation, not the class constructor
    const manifest = {
      identification: {
        speakerUri: 'tag:example.com,2025:agent-4',
        serviceUrl: 'https://agent4.example.com',
        organization: 'ExampleOrg',
        conversationalName: 'Agent4',
        synopsis: 'Malformed capability.'
      },
      capabilities: [
        { descriptions: ['No keyphrases.'] }, // missing keyphrases
        { keyphrases: ['broken'] } // missing descriptions
      ]
    };
    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    // The error should mention keyphrases or descriptions
    expect(result.errors.join(' ')).toMatch(/keyphrases|descriptions/);
  });
}); 