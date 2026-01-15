import { describe, it, expect, vi } from 'vitest';
import { ConditionalCommand } from './conditional-command';
import { AbstractCommand } from './abstract-command';
import { NullCommand } from './null-command';
import { WaitForTime } from './wait-for-time';
import { SerialCommandEnumerator } from './serial-command-enumerator';
import type { Command } from './command.interface';

class TestCommand extends AbstractCommand {
  public startCalled = false;
  public updateCount = 0;
  public stopCalled = false;
  public destroyCalled = false;
  private completeImmediately: boolean;

  constructor(completeImmediately = true) {
    super();
    this.completeImmediately = completeImmediately;
  }

  protected override onStart(): void {
    this.startCalled = true;
    if (this.completeImmediately) {
      this.complete();
    }
  }

  protected override onUpdate(_dt: number): void {
    this.updateCount++;
  }

  protected override onStop(): void {
    this.stopCalled = true;
  }

  protected override onDestroy(): void {
    this.destroyCalled = true;
  }

  public completeManually(): void {
    this.complete();
  }

  static create(completeImmediately = true): TestCommand {
    return new TestCommand(completeImmediately);
  }
}

describe('ConditionalCommand', () => {
  describe('Basic Behavior', () => {
    it('should execute true branch when predicate returns true', () => {
      const trueBranch = TestCommand.create();
      const falseBranch = TestCommand.create();
      const conditional = ConditionalCommand.create(
        () => true,
        trueBranch,
        falseBranch
      );

      conditional.start();

      expect(trueBranch.startCalled).toBe(true);
      expect(falseBranch.startCalled).toBe(false);
    });

    it('should execute false branch when predicate returns false', () => {
      const trueBranch = TestCommand.create();
      const falseBranch = TestCommand.create();
      const conditional = ConditionalCommand.create(
        () => false,
        trueBranch,
        falseBranch
      );

      conditional.start();

      expect(trueBranch.startCalled).toBe(false);
      expect(falseBranch.startCalled).toBe(true);
    });

    it('should treat null false branch as NullCommand', () => {
      const trueBranch = TestCommand.create();
      const conditional = ConditionalCommand.create(
        () => false,
        trueBranch,
        null
      );

      conditional.start();
      expect(conditional.isCompleted).toBe(true);
    });

    it('should treat undefined false branch as NullCommand', () => {
      const trueBranch = TestCommand.create();
      const conditional = ConditionalCommand.create(
        () => false,
        trueBranch
      );

      conditional.start();
      expect(conditional.isCompleted).toBe(true);
    });

    it('should complete when chosen branch completes', () => {
      const trueBranch = TestCommand.create();
      const conditional = ConditionalCommand.create(
        () => true,
        trueBranch
      );

      expect(conditional.isCompleted).toBe(false);
      conditional.start();
      expect(conditional.isCompleted).toBe(true);
    });
  });

  describe('Lifecycle Delegation', () => {
    it('should delegate update to active branch', () => {
      const trueBranch = TestCommand.create(false);
      const conditional = ConditionalCommand.create(
        () => true,
        trueBranch
      );

      conditional.start();
      conditional.update(0.016);
      conditional.update(0.016);

      expect(trueBranch.updateCount).toBe(2);
    });

    it('should not call update on non-chosen branch', () => {
      const trueBranch = TestCommand.create();
      const falseBranch = TestCommand.create();
      const conditional = ConditionalCommand.create(
        () => true,
        trueBranch,
        falseBranch
      );

      conditional.start();
      conditional.update(0.016);

      expect(trueBranch.updateCount).toBeGreaterThanOrEqual(0);
      expect(falseBranch.updateCount).toBe(0);
    });

    it('should delegate stop to active branch', () => {
      const trueBranch = TestCommand.create(false);
      const conditional = ConditionalCommand.create(
        () => true,
        trueBranch
      );

      conditional.start();
      conditional.stop();

      expect(trueBranch.stopCalled).toBe(true);
    });

    it('should destroy both branches regardless of which was active', () => {
      const trueBranch = TestCommand.create();
      const falseBranch = TestCommand.create();
      const conditional = ConditionalCommand.create(
        () => true,
        trueBranch,
        falseBranch
      );

      conditional.start();
      conditional.destroy();

      expect(trueBranch.destroyCalled).toBe(true);
      expect(falseBranch.destroyCalled).toBe(true);
    });
  });

  describe('Completion Detection', () => {
    it('should complete immediately when branch completes immediately', () => {
      const trueBranch = TestCommand.create(true);
      const conditional = ConditionalCommand.create(
        () => true,
        trueBranch
      );

      conditional.start();
      expect(conditional.isCompleted).toBe(true);
    });

    it('should complete after delayed branch completes', () => {
      const wait = WaitForTime.create(0.1);
      const conditional = ConditionalCommand.create(
        () => true,
        wait
      );

      conditional.start();
      expect(conditional.isCompleted).toBe(false);

      conditional.update(0.05);
      expect(conditional.isCompleted).toBe(false);

      conditional.update(0.06);
      expect(conditional.isCompleted).toBe(true);
    });

    it('should notify parent enumerator when completed', () => {
      const trueBranch = TestCommand.create(false);
      const conditional = ConditionalCommand.create(
        () => true,
        trueBranch
      );

      const enumerator = new SerialCommandEnumerator();
      enumerator.addCommand(conditional);
      enumerator.start();

      expect(enumerator.isCompleted).toBe(false);

      trueBranch.completeManually();
      conditional.update(0.016);

      expect(conditional.isCompleted).toBe(true);
      expect(enumerator.isCompleted).toBe(true);
    });
  });

  describe('Serial Enumerator Integration', () => {
    it('should work within a serial sequence', () => {
      const log: string[] = [];
      const cmd1 = TestCommand.create();
      const trueBranch = TestCommand.create();
      const falseBranch = TestCommand.create();
      const conditional = ConditionalCommand.create(
        () => true,
        trueBranch,
        falseBranch
      );
      const cmd2 = TestCommand.create();

      const enumerator = new SerialCommandEnumerator();
      enumerator.addCommand(cmd1);
      enumerator.addCommand(conditional);
      enumerator.addCommand(cmd2);

      enumerator.start();
      expect(cmd1.startCalled).toBe(true);
      expect(trueBranch.startCalled).toBe(true);
      expect(falseBranch.startCalled).toBe(false);
      expect(cmd2.startCalled).toBe(true);
      expect(enumerator.isCompleted).toBe(true);
    });

    it('should advance serial sequence after conditional completes', () => {
      const wait = WaitForTime.create(0.1);
      const conditional = ConditionalCommand.create(
        () => true,
        wait
      );
      const cmd2 = TestCommand.create();

      const enumerator = new SerialCommandEnumerator();
      enumerator.addCommand(conditional);
      enumerator.addCommand(cmd2);

      enumerator.start();
      expect(cmd2.startCalled).toBe(false);

      enumerator.update(0.1);
      expect(conditional.isCompleted).toBe(true);
      expect(cmd2.startCalled).toBe(true);
    });

    it('should handle multiple conditionals in sequence', () => {
      let flag1 = true;
      let flag2 = false;

      const cond1True = TestCommand.create();
      const cond1False = TestCommand.create();
      const conditional1 = ConditionalCommand.create(
        () => flag1,
        cond1True,
        cond1False
      );

      const cond2True = TestCommand.create();
      const cond2False = TestCommand.create();
      const conditional2 = ConditionalCommand.create(
        () => flag2,
        cond2True,
        cond2False
      );

      const enumerator = new SerialCommandEnumerator();
      enumerator.addCommand(conditional1);
      enumerator.addCommand(conditional2);

      enumerator.start();

      expect(cond1True.startCalled).toBe(true);
      expect(cond1False.startCalled).toBe(false);
      expect(cond2True.startCalled).toBe(false);
      expect(cond2False.startCalled).toBe(true);
    });
  });

  describe('Nested Conditionals', () => {
    it('should support conditional as true branch', () => {
      const innerTrue = TestCommand.create();
      const innerFalse = TestCommand.create();
      const inner = ConditionalCommand.create(
        () => false,
        innerTrue,
        innerFalse
      );

      const outerFalse = TestCommand.create();
      const outer = ConditionalCommand.create(
        () => true,
        inner,
        outerFalse
      );

      outer.start();

      expect(innerTrue.startCalled).toBe(false);
      expect(innerFalse.startCalled).toBe(true);
      expect(outerFalse.startCalled).toBe(false);
      expect(outer.isCompleted).toBe(true);
    });

    it('should support conditional as false branch', () => {
      const outerTrue = TestCommand.create();
      const innerTrue = TestCommand.create();
      const innerFalse = TestCommand.create();
      const inner = ConditionalCommand.create(
        () => true,
        innerTrue,
        innerFalse
      );

      const outer = ConditionalCommand.create(
        () => false,
        outerTrue,
        inner
      );

      outer.start();

      expect(outerTrue.startCalled).toBe(false);
      expect(innerTrue.startCalled).toBe(true);
      expect(innerFalse.startCalled).toBe(false);
      expect(outer.isCompleted).toBe(true);
    });

    it('should support deep nesting (3 levels)', () => {
      const level3True = TestCommand.create();
      const level3False = TestCommand.create();
      const level3 = ConditionalCommand.create(
        () => true,
        level3True,
        level3False
      );

      const level2False = TestCommand.create();
      const level2 = ConditionalCommand.create(
        () => true,
        level3,
        level2False
      );

      const level1False = TestCommand.create();
      const level1 = ConditionalCommand.create(
        () => true,
        level2,
        level1False
      );

      level1.start();

      expect(level3True.startCalled).toBe(true);
      expect(level3False.startCalled).toBe(false);
      expect(level2False.startCalled).toBe(false);
      expect(level1False.startCalled).toBe(false);
      expect(level1.isCompleted).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should propagate predicate errors naturally', () => {
      const error = new Error('Predicate error');
      const trueBranch = TestCommand.create();
      const conditional = ConditionalCommand.create(
        () => {
          throw error;
        },
        trueBranch
      );

      expect(() => conditional.start()).toThrow(error);
    });

    it('should re-evaluate predicate on restart', () => {
      let flag = true;
      const trueBranch = TestCommand.create();
      const falseBranch = TestCommand.create();
      const conditional = ConditionalCommand.create(
        () => flag,
        trueBranch,
        falseBranch
      );

      conditional.start();
      expect(trueBranch.startCalled).toBe(true);
      expect(falseBranch.startCalled).toBe(false);

      flag = false;
      trueBranch.startCalled = false;
      falseBranch.startCalled = false;

      conditional.start();
      expect(trueBranch.startCalled).toBe(false);
      expect(falseBranch.startCalled).toBe(true);
    });

    it('should work when both branches are NullCommand', () => {
      const conditional = ConditionalCommand.create(
        () => true,
        NullCommand.create(),
        NullCommand.create()
      );

      conditional.start();
      expect(conditional.isCompleted).toBe(true);
    });

    it('should handle stop before branch completes', () => {
      const trueBranch = TestCommand.create(false);
      const conditional = ConditionalCommand.create(
        () => true,
        trueBranch
      );

      conditional.start();
      expect(conditional.isCompleted).toBe(false);

      conditional.stop();
      expect(trueBranch.stopCalled).toBe(true);
      expect(conditional.isCompleted).toBe(true);
    });

    it('should handle destroy before branch completes', () => {
      const trueBranch = TestCommand.create(false);
      const falseBranch = TestCommand.create();
      const conditional = ConditionalCommand.create(
        () => true,
        trueBranch,
        falseBranch
      );

      conditional.start();
      expect(conditional.isCompleted).toBe(false);

      conditional.destroy();
      expect(trueBranch.destroyCalled).toBe(true);
      expect(falseBranch.destroyCalled).toBe(true);
    });

    it('should handle truthy/falsy coercion', () => {
      const trueBranch = TestCommand.create();
      const falseBranch = TestCommand.create();

      const conditional = ConditionalCommand.create(
        () => 1 as any,
        trueBranch,
        falseBranch
      );

      conditional.start();
      expect(trueBranch.startCalled).toBe(true);
      expect(falseBranch.startCalled).toBe(false);
    });

    it('should stop updating branch after it completes', () => {
      const trueBranch = TestCommand.create(false);
      const conditional = ConditionalCommand.create(
        () => true,
        trueBranch
      );

      conditional.start();
      conditional.update(0.016);
      expect(trueBranch.updateCount).toBe(1);

      trueBranch.completeManually();
      conditional.update(0.016);

      conditional.update(0.016);
      conditional.update(0.016);

      expect(trueBranch.updateCount).toBe(1);
    });
  });
});
