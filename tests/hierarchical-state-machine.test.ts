import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  StateMachine,
  SimpleState,
  CommandableState,
  AbstractCommand,
  type Command,
  type State,
} from '../src';

describe('Hierarchical State Machine', () => {
  describe('Hierarchy Management', () => {
    it('should add substates and maintain parent/child relationships', () => {
      const parent = SimpleState.create('Parent');
      const child = SimpleState.create('Child');

      parent.addSubstate(child);

      expect(child.parent).toBe(parent);
      expect(parent.children).toContain(child);
      expect(parent.children.length).toBe(1);
    });

    it('should build correct state paths', () => {
      const parent = SimpleState.create('Parent');
      const child = SimpleState.create('Child');
      const grandchild = SimpleState.create('Grandchild');

      parent.addSubstate(child);
      child.addSubstate(grandchild);

      expect(parent.getStatePath()).toBe('Parent');
      expect(child.getStatePath()).toBe('Parent.Child');
      expect(grandchild.getStatePath()).toBe('Parent.Child.Grandchild');
    });

    it('should prevent circular references', () => {
      const stateA = SimpleState.create('A');
      const stateB = SimpleState.create('B');

      stateA.addSubstate(stateB);

      expect(() => stateB.addSubstate(stateA)).toThrow('circular reference');
    });

    it('should prevent duplicate sibling names', () => {
      const parent = SimpleState.create('Parent');
      const child1 = SimpleState.create('Child');
      const child2 = SimpleState.create('Child');

      parent.addSubstate(child1);

      expect(() => parent.addSubstate(child2)).toThrow('sibling with name');
    });

    it('should propagate stateMachine reference to all descendants', () => {
      const sm = StateMachine.create();
      const parent = SimpleState.create('Parent');
      const child = SimpleState.create('Child');
      const grandchild = SimpleState.create('Grandchild');

      parent.addSubstate(child);
      child.addSubstate(grandchild);

      sm.addState(parent);

      expect(parent.stateMachine).toBe(sm);
      expect(child.stateMachine).toBe(sm);
      expect(grandchild.stateMachine).toBe(sm);
    });

    it('should clear stateMachine reference when removing substate', () => {
      const sm = StateMachine.create();
      const parent = SimpleState.create('Parent');
      const child = SimpleState.create('Child');

      parent.addSubstate(child);
      sm.addState(parent);

      expect(child.stateMachine).toBe(sm);

      parent.removeSubstate(child);

      expect(child.stateMachine).toBeNull();
      expect(child.parent).toBeNull();
    });

    it('should prevent adding state with stateMachine as substate', () => {
      const sm = StateMachine.create();
      const parent = SimpleState.create('Parent');
      const child = SimpleState.create('Child');

      sm.addState(child);

      expect(() => parent.addSubstate(child)).toThrow('already registered with a StateMachine');
    });

    it('should prevent adding state with parent to StateMachine', () => {
      const sm = StateMachine.create();
      const parent = SimpleState.create('Parent');
      const child = SimpleState.create('Child');

      parent.addSubstate(child);

      expect(() => sm.addState(child)).toThrow('existing parent');
    });
  });

  describe('Enter/Exit Propagation', () => {
    it('should call enterState on all ancestors when entering path', () => {
      const sm = StateMachine.create();
      const parent = SimpleState.create('Parent');
      const child = SimpleState.create('Child');
      const grandchild = SimpleState.create('Grandchild');

      const enterCalls: string[] = [];
      parent.enterState = vi.fn(() => enterCalls.push('Parent'));
      child.enterState = vi.fn(() => enterCalls.push('Child'));
      grandchild.enterState = vi.fn(() => enterCalls.push('Grandchild'));

      parent.addSubstate(child);
      child.addSubstate(grandchild);
      sm.addState(parent);

      sm.setState('Parent.Child.Grandchild');

      expect(enterCalls).toEqual(['Parent', 'Child', 'Grandchild']);
    });

    it('should track lastActiveChild during entry', () => {
      const sm = StateMachine.create();
      const parent = SimpleState.create('Parent');
      const child1 = SimpleState.create('Child1');
      const child2 = SimpleState.create('Child2');

      parent.addSubstate(child1);
      parent.addSubstate(child2);
      sm.addState(parent);

      sm.setState('Parent.Child1');
      expect(parent.lastActiveChild).toBe(child1);

      sm.setState('Parent.Child2');
      expect(parent.lastActiveChild).toBe(child2);
    });

    it('should set activeState to leaf state after hierarchical entry', () => {
      const sm = StateMachine.create();
      const parent = SimpleState.create('Parent');
      const child = SimpleState.create('Child');

      parent.addSubstate(child);
      sm.addState(parent);

      sm.setState('Parent.Child');

      expect(sm.currentState).toBe(child);
    });

    it('should emit state change with full path', () => {
      const sm = StateMachine.create();
      const parent = SimpleState.create('Parent');
      const child = SimpleState.create('Child');

      parent.addSubstate(child);
      sm.addState(parent);

      const stateChanges: string[] = [];
      sm.addStateChangeListener((name) => stateChanges.push(name));

      sm.setState('Parent.Child');

      expect(stateChanges).toContain('Parent.Child');
    });

    it('should return null for invalid paths', () => {
      const parent = SimpleState.create('Parent');
      const child = SimpleState.create('Child');

      parent.addSubstate(child);

      expect(parent.enterPath('NonExistent')).toBeNull();
      expect(parent.enterPath('Child.NonExistent')).toBeNull();
    });

    it('should reject malformed paths', () => {
      const parent = SimpleState.create('Parent');

      expect(parent.enterPath('.')).toBeNull();
      expect(parent.enterPath('.Child')).toBeNull();
      expect(parent.enterPath('Child.')).toBeNull();
      expect(parent.enterPath('Child..Grandchild')).toBeNull();
    });
  });

  describe('Hierarchical Transitions', () => {
    it('should transition between siblings without exiting parent', () => {
      const sm = StateMachine.create();
      const parent = SimpleState.create('Parent');
      const child1 = SimpleState.create('Child1');
      const child2 = SimpleState.create('Child2');

      const parentExits: number[] = [];
      const parentEnters: number[] = [];
      let callCount = 0;

      parent.enterState = vi.fn(() => parentEnters.push(++callCount));
      parent.exitState = vi.fn(() => parentExits.push(++callCount));

      parent.addSubstate(child1);
      parent.addSubstate(child2);
      child1.addTransition('next', child2);

      sm.addState(parent);
      sm.setState('Parent.Child1');

      parentEnters.length = 0;
      parentExits.length = 0;

      sm.handleTransition('next');

      expect(parentExits.length).toBe(0);
      expect(parentEnters.length).toBe(0);
      expect(sm.currentState).toBe(child2);
    });

    it('should find correct common ancestor between cousins', () => {
      const sm = StateMachine.create();
      const root = SimpleState.create('Root');
      const branch1 = SimpleState.create('Branch1');
      const branch2 = SimpleState.create('Branch2');
      const leaf1 = SimpleState.create('Leaf1');
      const leaf2 = SimpleState.create('Leaf2');

      root.addSubstate(branch1);
      root.addSubstate(branch2);
      branch1.addSubstate(leaf1);
      branch2.addSubstate(leaf2);

      leaf1.addTransition('cross', leaf2);

      sm.addState(root);
      sm.setState('Root.Branch1.Leaf1');

      const exitCalls: string[] = [];
      const enterCalls: string[] = [];

      leaf1.exitState = vi.fn(() => exitCalls.push('Leaf1'));
      branch1.exitState = vi.fn(() => exitCalls.push('Branch1'));
      root.exitState = vi.fn(() => exitCalls.push('Root'));
      branch2.enterState = vi.fn(() => enterCalls.push('Branch2'));
      leaf2.enterState = vi.fn(() => enterCalls.push('Leaf2'));

      sm.handleTransition('cross');

      expect(exitCalls).toEqual(['Leaf1', 'Branch1']);
      expect(enterCalls).toEqual(['Branch2', 'Leaf2']);
      expect(sm.currentState).toBe(leaf2);
    });

    it('should handle transition to ancestor state', () => {
      const sm = StateMachine.create();
      const parent = SimpleState.create('Parent');
      const child = SimpleState.create('Child');
      const grandchild = SimpleState.create('Grandchild');

      parent.addSubstate(child);
      child.addSubstate(grandchild);

      grandchild.addTransition('up', 'Parent');

      sm.addState(parent);
      sm.setState('Parent.Child.Grandchild');

      const exitCalls: string[] = [];
      grandchild.exitState = vi.fn(() => exitCalls.push('Grandchild'));
      child.exitState = vi.fn(() => exitCalls.push('Child'));
      parent.exitState = vi.fn(() => exitCalls.push('Parent'));

      sm.handleTransition('up');

      expect(exitCalls).toEqual(['Grandchild', 'Child']);
      expect(sm.currentState).toBe(parent);
    });

    it('should handle transition to self as no-op', () => {
      const state = SimpleState.create('State');
      const enterCallCount = vi.fn();
      const exitCallCount = vi.fn();

      state.enterState = enterCallCount;
      state.exitState = exitCallCount;

      state.transitionTo(state);

      expect(enterCallCount).not.toHaveBeenCalled();
      expect(exitCallCount).not.toHaveBeenCalled();
    });
  });

  describe('Transition Inheritance', () => {
    it('should inherit transitions from parent', () => {
      const sm = StateMachine.create();
      const parent = SimpleState.create('Parent');
      const child = SimpleState.create('Child');
      const target = SimpleState.create('Target');

      parent.addTransition('go', target);
      parent.addSubstate(child);

      sm.addState(parent);
      sm.addState(target);

      sm.setState('Parent.Child');
      sm.handleTransition('go');

      expect(sm.currentState).toBe(target);
    });

    it('should allow child to override parent transition', () => {
      const sm = StateMachine.create();
      const parent = SimpleState.create('Parent');
      const child = SimpleState.create('Child');
      const parentTarget = SimpleState.create('ParentTarget');
      const childTarget = SimpleState.create('ChildTarget');

      parent.addTransition('go', parentTarget);
      child.addTransition('go', childTarget);
      parent.addSubstate(child);

      sm.addState(parent);
      sm.addState(parentTarget);
      sm.addState(childTarget);

      sm.setState('Parent.Child');
      sm.handleTransition('go');

      expect(sm.currentState).toBe(childTarget);
    });

    it('should support multi-level transition inheritance', () => {
      const sm = StateMachine.create();
      const grandparent = SimpleState.create('Grandparent');
      const parent = SimpleState.create('Parent');
      const child = SimpleState.create('Child');
      const target = SimpleState.create('Target');

      grandparent.addTransition('go', target);
      grandparent.addSubstate(parent);
      parent.addSubstate(child);

      sm.addState(grandparent);
      sm.addState(target);

      sm.setState('Grandparent.Parent.Child');
      sm.handleTransition('go');

      expect(sm.currentState).toBe(target);
    });

    it('should resolve sibling transitions first', () => {
      const sm = StateMachine.create();
      const parent = SimpleState.create('Parent');
      const child1 = SimpleState.create('Child1');
      const child2 = SimpleState.create('Child2');

      parent.addSubstate(child1);
      parent.addSubstate(child2);
      child1.addTransition('next', 'Child2');

      sm.addState(parent);
      sm.setState('Parent.Child1');

      sm.handleTransition('next');

      expect(sm.currentState).toBe(child2);
    });

    it('should handle absolute path transitions', () => {
      const sm = StateMachine.create();
      const root1 = SimpleState.create('Root1');
      const root2 = SimpleState.create('Root2');
      const child1 = SimpleState.create('Child1');
      const child2 = SimpleState.create('Child2');

      root1.addSubstate(child1);
      root2.addSubstate(child2);

      child1.addTransition('jump', 'Root2.Child2');

      sm.addState(root1);
      sm.addState(root2);

      sm.setState('Root1.Child1');
      sm.handleTransition('jump');

      expect(sm.currentState).toBe(child2);
    });
  });

  describe('History States', () => {
    it('should remember last active child', () => {
      const parent = SimpleState.create('Parent');
      const child1 = SimpleState.create('Child1');
      const child2 = SimpleState.create('Child2');

      parent.addSubstate(child1);
      parent.addSubstate(child2);

      parent.enterPath('Child1');
      expect(parent.lastActiveChild).toBe(child1);

      parent.enterPath('Child2');
      expect(parent.lastActiveChild).toBe(child2);
    });

    it('should restore last active child with enterWithHistory', () => {
      const sm = StateMachine.create();
      const parent = SimpleState.create('Parent');
      const child1 = SimpleState.create('Child1');
      const child2 = SimpleState.create('Child2');

      parent.addSubstate(child1);
      parent.addSubstate(child2);

      sm.addState(parent);

      sm.setState('Parent.Child2');

      const leafState = parent.enterWithHistory();

      expect(leafState).toBe(child2);
    });

    it('should support deep history through recursion', () => {
      const sm = StateMachine.create();
      const root = SimpleState.create('Root');
      const level1 = SimpleState.create('Level1');
      const level2 = SimpleState.create('Level2');
      const level3 = SimpleState.create('Level3');

      root.addSubstate(level1);
      level1.addSubstate(level2);
      level2.addSubstate(level3);

      sm.addState(root);

      sm.setState('Root.Level1.Level2.Level3');

      const leafState = root.enterWithHistory();

      expect(leafState).toBe(level3);
    });

    it('should handle history when no previous child exists', () => {
      const parent = SimpleState.create('Parent');
      const child = SimpleState.create('Child');

      parent.addSubstate(child);

      const leafState = parent.enterWithHistory();

      expect(leafState).toBe(parent);
    });
  });

  describe('CommandableState Integration', () => {
    class LogCommand extends AbstractCommand {
      constructor(
        private message: string,
        private logTarget: string[]
      ) {
        super();
      }

      protected override onStart(): void {
        this.logTarget.push(this.message);
        this.complete();
      }

      static create(message: string, logTarget: string[]): Command {
        return new LogCommand(message, logTarget);
      }
    }

    it('should execute parent commands when entering hierarchy', () => {
      const sm = StateMachine.create();
      const logs: string[] = [];

      const parent = CommandableState.create('Parent');
      const child = SimpleState.create('Child');

      parent.addCommand(LogCommand.create('Parent command', logs));
      parent.addSubstate(child);

      sm.addState(parent);
      sm.setState('Parent.Child');

      expect(logs).toContain('Parent command');
    });

    it('should execute both parent and child commands in hierarchy', () => {
      const sm = StateMachine.create();
      const logs: string[] = [];

      const parent = CommandableState.create('Parent');
      const child = CommandableState.create('Child');

      parent.addCommand(LogCommand.create('Parent command', logs));
      child.addCommand(LogCommand.create('Child command', logs));

      parent.addSubstate(child);
      sm.addState(parent);

      sm.setState('Parent.Child');

      expect(logs).toEqual(['Parent command', 'Child command']);
    });

    it('should not restart parent commands on sibling transition', () => {
      const sm = StateMachine.create();
      const logs: string[] = [];

      const parent = CommandableState.create('Parent');
      const child1 = CommandableState.create('Child1');
      const child2 = CommandableState.create('Child2');

      parent.addCommand(LogCommand.create('Parent command', logs));
      child1.addCommand(LogCommand.create('Child1 command', logs));
      child2.addCommand(LogCommand.create('Child2 command', logs));

      parent.addSubstate(child1);
      parent.addSubstate(child2);
      child1.addTransition('next', child2);

      sm.addState(parent);
      sm.setState('Parent.Child1');

      logs.length = 0;

      sm.handleTransition('next');

      expect(logs).toEqual(['Child2 command']);
      expect(logs).not.toContain('Parent command');
    });

    it('should stop all commands when exiting hierarchy', () => {
      const sm = StateMachine.create();
      const parent = CommandableState.create('Parent');
      const child = CommandableState.create('Child');
      const other = SimpleState.create('Other');

      parent.addSubstate(child);
      sm.addState(parent);
      sm.addState(other);

      const parentStopSpy = vi.spyOn(parent as any, 'exitState');
      const childStopSpy = vi.spyOn(child as any, 'exitState');

      sm.setState('Parent.Child');
      sm.setState('Other');

      expect(childStopSpy).toHaveBeenCalled();
      expect(parentStopSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should destroy all children when destroying parent', () => {
      const parent = SimpleState.create('Parent');
      const child = SimpleState.create('Child');
      const grandchild = SimpleState.create('Grandchild');

      parent.addSubstate(child);
      child.addSubstate(grandchild);

      const childDestroySpy = vi.spyOn(child, 'destroy');
      const grandchildDestroySpy = vi.spyOn(grandchild, 'destroy');

      parent.destroy();

      expect(childDestroySpy).toHaveBeenCalled();
      expect(grandchildDestroySpy).toHaveBeenCalled();
    });

    it('should exit active state before removing it', () => {
      const sm = StateMachine.create();
      const parent = SimpleState.create('Parent');
      const child = SimpleState.create('Child');

      parent.addSubstate(child);
      sm.addState(parent);

      sm.setState('Parent.Child');

      const childExitSpy = vi.spyOn(child, 'exitState');

      parent.removeSubstate(child);

      expect(childExitSpy).toHaveBeenCalled();
    });

    it('should handle deep nesting correctly', () => {
      const sm = StateMachine.create();
      const states: State[] = [];

      let current = SimpleState.create('Level0');
      states.push(current);

      for (let i = 1; i <= 5; i++) {
        const next = SimpleState.create(`Level${i}`);
        states.push(next);
        current.addSubstate(next);
        current = next;
      }

      sm.addState(states[0]);

      const path = states.map((s) => s.stateName).join('.');
      sm.setState(path);

      expect(sm.currentState).toBe(states[5]);
      expect(sm.currentState?.getStatePath()).toBe(path);
    });

    it('should maintain correct state after complex transitions', () => {
      const sm = StateMachine.create();
      const root1 = SimpleState.create('Root1');
      const root2 = SimpleState.create('Root2');
      const child1a = SimpleState.create('Child1a');
      const child1b = SimpleState.create('Child1b');
      const child2a = SimpleState.create('Child2a');

      root1.addSubstate(child1a);
      root1.addSubstate(child1b);
      root2.addSubstate(child2a);

      child1a.addTransition('toB', child1b);
      child1b.addTransition('toRoot2', 'Root2.Child2a');
      child2a.addTransition('back', 'Root1.Child1a');

      sm.addState(root1);
      sm.addState(root2);

      sm.setState('Root1.Child1a');
      expect(sm.currentState).toBe(child1a);

      sm.handleTransition('toB');
      expect(sm.currentState).toBe(child1b);

      sm.handleTransition('toRoot2');
      expect(sm.currentState).toBe(child2a);

      sm.handleTransition('back');
      expect(sm.currentState).toBe(child1a);
    });
  });

  describe('Backwards Compatibility', () => {
    it('should work with flat state machines (no hierarchy)', () => {
      const sm = StateMachine.create();
      const stateA = SimpleState.create('StateA');
      const stateB = SimpleState.create('StateB');

      stateA.addTransition('next', stateB);
      stateB.addTransition('back', stateA);

      sm.addState(stateA);
      sm.addState(stateB);

      sm.setState('StateA');
      expect(sm.currentState).toBe(stateA);

      sm.handleTransition('next');
      expect(sm.currentState).toBe(stateB);

      sm.handleTransition('back');
      expect(sm.currentState).toBe(stateA);
    });

    it('should maintain state change callback behavior', () => {
      const sm = StateMachine.create();
      const stateA = SimpleState.create('StateA');
      const stateB = SimpleState.create('StateB');

      sm.addState(stateA);
      sm.addState(stateB);

      const stateChanges: string[] = [];
      sm.addStateChangeListener((name) => stateChanges.push(name));

      sm.setState('StateA');
      sm.setState('StateB');

      expect(stateChanges).toEqual(['StateA', 'StateB']);
    });

    it('should support direct State object transitions', () => {
      const sm = StateMachine.create();
      const stateA = SimpleState.create('StateA');
      const stateB = SimpleState.create('StateB');

      stateA.addTransition('next', stateB);

      sm.addState(stateA);
      sm.addState(stateB);

      sm.setState('StateA');
      sm.handleTransition('next');

      expect(sm.currentState).toBe(stateB);
    });
  });
});
