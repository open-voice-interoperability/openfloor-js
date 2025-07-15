import { Event } from '../src/envelope';
import { EventType } from '../src/types';

describe('OFP Floor Management State Transitions', () => {
  function applyFloorEvent(floorHolder: string | null, event: Event): string | null {
    if (event.eventType === 'grantFloor') {
      const uri = (event.toObject().to as any)?.speakerUri;
      if (uri) return uri;
    } else if (event.eventType === 'revokeFloor' || event.eventType === 'yieldFloor') {
      // Only clear if the floorHolder matches the target (or for yield, if the sender matches)
      const uri = (event.toObject().to as any)?.speakerUri;
      if (uri && floorHolder === uri) return null;
      // For yieldFloor, also allow sender to yield
      if (event.eventType === 'yieldFloor' && (event.toObject().sender as any)?.speakerUri === floorHolder) return null;
    }
    // requestFloor does not change state directly
    return floorHolder;
  }

  it('grantFloor sets the floor holder', () => {
    let floor: string | null = null;
    const grant = new Event({ eventType: 'grantFloor' as EventType, to: { speakerUri: 'tag:example.com,2025:agent-1' } });
    floor = applyFloorEvent(floor, grant);
    expect(floor).toBe('tag:example.com,2025:agent-1');
  });

  it('revokeFloor clears the floor holder if matches', () => {
    let floor: string | null = 'tag:example.com,2025:agent-1';
    const revoke = new Event({ eventType: 'revokeFloor' as EventType, to: { speakerUri: 'tag:example.com,2025:agent-1' } });
    floor = applyFloorEvent(floor, revoke);
    expect(floor).toBeNull();
  });

  it('yieldFloor clears the floor holder if matches', () => {
    let floor: string | null = 'tag:example.com,2025:agent-1';
    // Simulate yield event with sender as the agent
    const yieldEvent = new Event({ eventType: 'yieldFloor' as EventType });
    (yieldEvent as any).toObject = () => ({ eventType: 'yieldFloor', sender: { speakerUri: 'tag:example.com,2025:agent-1' } });
    floor = applyFloorEvent(floor, yieldEvent);
    expect(floor).toBeNull();
  });

  it('revokeFloor does nothing if floor holder does not match', () => {
    let floor: string | null = 'tag:example.com,2025:agent-2';
    const revoke = new Event({ eventType: 'revokeFloor' as EventType, to: { speakerUri: 'tag:example.com,2025:agent-1' } });
    floor = applyFloorEvent(floor, revoke);
    expect(floor).toBe('tag:example.com,2025:agent-2');
  });

  it('yieldFloor does nothing if sender does not match floor holder', () => {
    let floor: string | null = 'tag:example.com,2025:agent-2';
    const yieldEvent = new Event({ eventType: 'yieldFloor' as EventType });
    (yieldEvent as any).toObject = () => ({ eventType: 'yieldFloor', sender: { speakerUri: 'tag:example.com,2025:agent-1' } });
    floor = applyFloorEvent(floor, yieldEvent);
    expect(floor).toBe('tag:example.com,2025:agent-2');
  });

  it('grantFloor to same agent twice does not change state', () => {
    let floor: string | null = 'tag:example.com,2025:agent-1';
    const grant = new Event({ eventType: 'grantFloor' as EventType, to: { speakerUri: 'tag:example.com,2025:agent-1' } });
    floor = applyFloorEvent(floor, grant);
    expect(floor).toBe('tag:example.com,2025:agent-1');
  });

  it('requestFloor does not change the floor holder', () => {
    let floor: string | null = 'tag:example.com,2025:agent-1';
    const request = new Event({ eventType: 'requestFloor' as EventType, to: { speakerUri: 'tag:example.com,2025:fm-1' } });
    floor = applyFloorEvent(floor, request);
    expect(floor).toBe('tag:example.com,2025:agent-1');
  });
}); 