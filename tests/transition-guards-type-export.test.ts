import { describe, it, expect } from 'vitest';
import { StateMachine, SimpleState, type TransitionGuard } from '../src';

describe('TransitionGuard Type Export', () => {
  it('should allow using TransitionGuard type from main export', () => {
    const createGuard = (condition: boolean): TransitionGuard => {
      return (_transitionName: string) => condition;
    };

    const sm = StateMachine.create();
    const stateA = SimpleState.create('A');
    const stateB = SimpleState.create('B');

    const guard: TransitionGuard = createGuard(true);
    stateA.addTransition('next', stateB, guard);

    sm.addState(stateA);
    sm.addState(stateB);
    sm.setState('A');

    sm.handleTransition('next');

    expect(sm.currentState).toBe(stateB);
  });
});
