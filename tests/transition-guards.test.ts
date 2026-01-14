import { describe, it, expect, vi } from 'vitest';
import { StateMachine, SimpleState } from '../src';

describe('Transition Guards', () => {
  describe('Basic Guard Behavior', () => {
    it('should execute transition when guard returns true', () => {
      const sm = StateMachine.create();
      const stateA = SimpleState.create('A');
      const stateB = SimpleState.create('B');

      const guard = vi.fn(() => true);
      stateA.addTransition('next', stateB, guard);

      sm.addState(stateA);
      sm.addState(stateB);
      sm.setState('A');

      sm.handleTransition('next');

      expect(guard).toHaveBeenCalledWith('next');
      expect(sm.currentState).toBe(stateB);
    });

    it('should block transition when guard returns false', () => {
      const sm = StateMachine.create();
      const stateA = SimpleState.create('A');
      const stateB = SimpleState.create('B');

      const guard = vi.fn(() => false);
      stateA.addTransition('next', stateB, guard);

      sm.addState(stateA);
      sm.addState(stateB);
      sm.setState('A');

      sm.handleTransition('next');

      expect(guard).toHaveBeenCalledWith('next');
      expect(sm.currentState).toBe(stateA);
    });

    it('should execute unguarded transition normally', () => {
      const sm = StateMachine.create();
      const stateA = SimpleState.create('A');
      const stateB = SimpleState.create('B');

      stateA.addTransition('next', stateB);

      sm.addState(stateA);
      sm.addState(stateB);
      sm.setState('A');

      sm.handleTransition('next');

      expect(sm.currentState).toBe(stateB);
    });
  });

  describe('Guard Context', () => {
    it('should receive transition name as parameter', () => {
      const sm = StateMachine.create();
      const stateA = SimpleState.create('A');
      const stateB = SimpleState.create('B');

      const guard = vi.fn(() => true);
      stateA.addTransition('myTransition', stateB, guard);

      sm.addState(stateA);
      sm.addState(stateB);
      sm.setState('A');

      sm.handleTransition('myTransition');

      expect(guard).toHaveBeenCalledWith('myTransition');
    });

    it('should allow guard to close over external state', () => {
      const sm = StateMachine.create();
      const stateA = SimpleState.create('A');
      const stateB = SimpleState.create('B');

      const gameState = { canTransition: false };
      const guard = () => gameState.canTransition;

      stateA.addTransition('next', stateB, guard);

      sm.addState(stateA);
      sm.addState(stateB);
      sm.setState('A');

      sm.handleTransition('next');
      expect(sm.currentState).toBe(stateA);

      gameState.canTransition = true;
      sm.handleTransition('next');
      expect(sm.currentState).toBe(stateB);
    });
  });

  describe('State Entry/Exit with Guards', () => {
    it('should not call exitState when guard blocks transition', () => {
      const sm = StateMachine.create();
      const stateA = SimpleState.create('A');
      const stateB = SimpleState.create('B');

      const exitSpy = vi.fn();
      const enterSpy = vi.fn();
      stateA.exitState = exitSpy;
      stateB.enterState = enterSpy;

      stateA.addTransition('next', stateB, () => false);

      sm.addState(stateA);
      sm.addState(stateB);
      sm.setState('A');

      sm.handleTransition('next');

      expect(exitSpy).not.toHaveBeenCalled();
      expect(enterSpy).not.toHaveBeenCalled();
    });

    it('should call exitState and enterState when guard allows transition', () => {
      const sm = StateMachine.create();
      const stateA = SimpleState.create('A');
      const stateB = SimpleState.create('B');

      const exitSpy = vi.fn();
      const enterSpy = vi.fn();
      stateA.exitState = exitSpy;
      stateB.enterState = enterSpy;

      stateA.addTransition('next', stateB, () => true);

      sm.addState(stateA);
      sm.addState(stateB);
      sm.setState('A');

      sm.handleTransition('next');

      expect(exitSpy).toHaveBeenCalled();
      expect(enterSpy).toHaveBeenCalled();
    });
  });

  describe('Hierarchical Guards', () => {
    it('should respect guards on inherited transitions', () => {
      const sm = StateMachine.create();
      const parent = SimpleState.create('Parent');
      const child1 = SimpleState.create('Child1');
      const child2 = SimpleState.create('Child2');

      parent.addSubstate(child1);
      parent.addSubstate(child2);

      const guard = vi.fn(() => false);
      parent.addTransition('next', child2, guard);

      sm.addState(parent);
      sm.setState('Parent.Child1');

      sm.handleTransition('next');

      expect(guard).toHaveBeenCalledWith('next');
      expect(sm.currentState).toBe(child1);
    });

    it('should handle guards with hierarchical path targets', () => {
      const sm = StateMachine.create();
      const root1 = SimpleState.create('Root1');
      const root2 = SimpleState.create('Root2');
      const child1 = SimpleState.create('Child1');
      const child2 = SimpleState.create('Child2');

      root1.addSubstate(child1);
      root2.addSubstate(child2);

      const guard = vi.fn(() => true);
      child1.addTransition('jump', 'Root2.Child2', guard);

      sm.addState(root1);
      sm.addState(root2);
      sm.setState('Root1.Child1');

      sm.handleTransition('jump');

      expect(guard).toHaveBeenCalledWith('jump');
      expect(sm.currentState).toBe(child2);
    });
  });

  describe('Multiple Guards', () => {
    it('should allow different guards on different transitions', () => {
      const sm = StateMachine.create();
      const stateA = SimpleState.create('A');
      const stateB = SimpleState.create('B');
      const stateC = SimpleState.create('C');

      const guardB = vi.fn(() => false);
      const guardC = vi.fn(() => true);

      stateA.addTransition('toB', stateB, guardB);
      stateA.addTransition('toC', stateC, guardC);

      sm.addState(stateA);
      sm.addState(stateB);
      sm.addState(stateC);
      sm.setState('A');

      sm.handleTransition('toB');
      expect(sm.currentState).toBe(stateA);

      sm.handleTransition('toC');
      expect(sm.currentState).toBe(stateC);
    });
  });

  describe('Edge Cases', () => {
    it('should handle guard on self-transition', () => {
      const sm = StateMachine.create();
      const state = SimpleState.create('State');

      const exitSpy = vi.fn();
      const enterSpy = vi.fn();
      state.exitState = exitSpy;
      state.enterState = enterSpy;

      const guard = vi.fn(() => true);
      state.addTransition('self', state, guard);

      sm.addState(state);
      sm.setState('State');

      exitSpy.mockClear();
      enterSpy.mockClear();

      sm.handleTransition('self');

      expect(guard).toHaveBeenCalledWith('self');
      expect(exitSpy).not.toHaveBeenCalled();
      expect(enterSpy).not.toHaveBeenCalled();
    });

    it('should handle transition removal with guard', () => {
      const sm = StateMachine.create();
      const stateA = SimpleState.create('A');
      const stateB = SimpleState.create('B');

      stateA.addTransition('next', stateB, () => true);
      stateA.removeTransition('next');

      sm.addState(stateA);
      sm.addState(stateB);
      sm.setState('A');

      sm.handleTransition('next');

      expect(sm.currentState).toBe(stateA);
    });

    it('should handle guard that throws error', () => {
      const sm = StateMachine.create();
      const stateA = SimpleState.create('A');
      const stateB = SimpleState.create('B');

      const guard = vi.fn(() => {
        throw new Error('Guard error');
      });

      stateA.addTransition('next', stateB, guard);

      sm.addState(stateA);
      sm.addState(stateB);
      sm.setState('A');

      expect(() => sm.handleTransition('next')).toThrow('Guard error');
    });
  });
});
