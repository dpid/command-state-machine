import { describe, it, expect } from 'vitest';
import { NullState, StateMachine } from '../src';

describe('NullState', () => {
  it('should create with default name', () => {
    const state = NullState.create();
    expect(state.stateName).toBe('NullState');
  });

  it('should create with custom name', () => {
    const state = NullState.create('CustomNull');
    expect(state.stateName).toBe('CustomNull');
  });

  it('should return null for stateMachine getter', () => {
    const state = NullState.create();
    expect(state.stateMachine).toBeNull();
  });

  it('should accept stateMachine setter without error', () => {
    const state = NullState.create();
    const sm = StateMachine.create();

    expect(() => {
      state.stateMachine = sm;
    }).not.toThrow();

    expect(state.stateMachine).toBeNull();

    sm.destroy();
  });

  it('should handle all lifecycle methods without error', () => {
    const state = NullState.create();

    expect(() => {
      state.enterState();
      state.update(0.016);
      state.exitState();
      state.destroy();
    }).not.toThrow();
  });

  it('should handle transition methods without error', () => {
    const state = NullState.create();
    const otherState = NullState.create('Other');

    expect(() => {
      state.addTransition('test', otherState);
      state.addTransition('test2', 'SomeState');
      state.handleTransition('test');
      state.removeTransition('test');
    }).not.toThrow();
  });

  it('should work as a state in StateMachine', () => {
    const sm = StateMachine.create();
    const nullState = NullState.create('Null');

    sm.addState(nullState);

    expect(() => {
      sm.setState('Null');
      sm.update(0.016);
    }).not.toThrow();

    expect(sm.currentState?.stateName).toBe('Null');

    sm.destroy();
  });

  it('should not affect state machine when transitions are added', () => {
    const sm = StateMachine.create();
    const nullState = NullState.create('Null');
    const otherState = NullState.create('Other');

    sm.addState(nullState);
    sm.addState(otherState);
    sm.setState('Null');

    nullState.addTransition('toOther', 'Other');
    nullState.handleTransition('toOther');

    expect(sm.currentState?.stateName).toBe('Null');

    sm.destroy();
  });
});
