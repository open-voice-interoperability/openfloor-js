import { Event } from '../src/envelope';
import { EventType } from '../src/types';

describe('OFP Agent Invitation, Uninvitation, and State Transitions', () => {
  function applyEventToState(state: string[], event: Event) {
    if (event.eventType === 'invite') {
      const uri = (event.toObject().to as any)?.speakerUri;
      if (uri && !state.includes(uri)) state.push(uri);
    } else if (event.eventType === 'uninvite' || event.eventType === 'bye') {
      const uri = (event.toObject().to as any)?.speakerUri || (event.toObject().sender as any)?.speakerUri;
      if (uri) {
        const idx = state.indexOf(uri);
        if (idx !== -1) state.splice(idx, 1);
      }
    }
    return state;
  }

  it('inviting an agent adds them to the state', () => {
    let state: string[] = [];
    const invite = new Event({ eventType: 'invite' as EventType, to: { speakerUri: 'tag:example.com,2025:agent-1' } });
    state = applyEventToState(state, invite);
    expect(state).toContain('tag:example.com,2025:agent-1');
  });

  it('uninviting an agent removes them from the state', () => {
    let state: string[] = ['tag:example.com,2025:agent-1'];
    const uninvite = new Event({ eventType: 'uninvite' as EventType, to: { speakerUri: 'tag:example.com,2025:agent-1' } });
    state = applyEventToState(state, uninvite);
    expect(state).not.toContain('tag:example.com,2025:agent-1');
  });

  it('agent leaving (bye) removes them from the state', () => {
    let state: string[] = ['tag:example.com,2025:agent-1'];
    // Simulate bye event with sender as the agent
    const bye = new Event({ eventType: 'bye' as EventType });
    // Manually add sender to bye event for this test
    (bye as any).toObject = () => ({ eventType: 'bye', sender: { speakerUri: 'tag:example.com,2025:agent-1' } });
    state = applyEventToState(state, bye);
    expect(state).not.toContain('tag:example.com,2025:agent-1');
  });

  it('uninviting an agent not present does not throw', () => {
    let state: string[] = ['tag:example.com,2025:agent-2'];
    const uninvite = new Event({ eventType: 'uninvite' as EventType, to: { speakerUri: 'tag:example.com,2025:agent-1' } });
    expect(() => applyEventToState(state, uninvite)).not.toThrow();
    expect(state).toEqual(['tag:example.com,2025:agent-2']);
  });

  it('double invite does not duplicate agent in state', () => {
    let state: string[] = [];
    const invite = new Event({ eventType: 'invite' as EventType, to: { speakerUri: 'tag:example.com,2025:agent-1' } });
    state = applyEventToState(state, invite);
    state = applyEventToState(state, invite);
    expect(state.filter(uri => uri === 'tag:example.com,2025:agent-1').length).toBe(1);
  });
}); 