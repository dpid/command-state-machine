import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AbstractCommand,
  SerialCommandEnumerator,
  ParallelCommandEnumerator,
  WaitForTime,
  type Command,
  type CompletionCallback,
} from '../src';

class TestCommand extends AbstractCommand {
  private shouldCompleteImmediately: boolean;

  constructor(shouldCompleteImmediately: boolean = true) {
    super();
    this.shouldCompleteImmediately = shouldCompleteImmediately;
  }

  protected override onStart(): void {
    if (this.shouldCompleteImmediately) {
      this.complete();
    }
  }

  completeManually(): void {
    this.complete();
  }

  static create(shouldCompleteImmediately: boolean = true): Command {
    return new TestCommand(shouldCompleteImmediately);
  }
}

describe('AbstractCommand - Completion Callbacks', () => {
  describe('Basic callback registration', () => {
    it('should allow registering completion callbacks', () => {
      const command = TestCommand.create(false);
      const callback = vi.fn();

      expect(() => command.onComplete(callback)).not.toThrow();
    });

    it('should allow registering multiple callbacks', () => {
      const command = TestCommand.create(true);
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      command.onComplete(callback1);
      command.onComplete(callback2);

      command.start();

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should allow unregistering callbacks', () => {
      const command = TestCommand.create(false);
      const callback = vi.fn();

      command.onComplete(callback);
      command.offComplete(callback);
      command.start();

      expect(callback).not.toHaveBeenCalled();
    });

    it('should return this for chaining', () => {
      const command = TestCommand.create(false);
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const result = command.onComplete(callback1).onComplete(callback2);

      expect(result).toBe(command);
    });

    it('should have methods available on Command interface type', () => {
      const command: Command = TestCommand.create(false);
      const callback = vi.fn();

      expect(() => command.onComplete(callback)).not.toThrow();
      expect(() => command.offComplete(callback)).not.toThrow();
    });
  });

  describe('Callback invocation on completion', () => {
    it('should fire callback when command completes normally', () => {
      const command = TestCommand.create(true);
      const callback = vi.fn();

      command.onComplete(callback);
      command.start();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should fire all registered callbacks', () => {
      const command = TestCommand.create(true);
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      command.onComplete(callback1);
      command.onComplete(callback2);
      command.onComplete(callback3);
      command.start();

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).toHaveBeenCalledTimes(1);
    });

    it('should fire callbacks in registration order', () => {
      const command = TestCommand.create(true);
      const order: number[] = [];

      command.onComplete(() => order.push(1));
      command.onComplete(() => order.push(2));
      command.onComplete(() => order.push(3));
      command.start();

      expect(order).toEqual([1, 2, 3]);
    });

    it('should fire callbacks only once per completion cycle', () => {
      const command = TestCommand.create(true);
      const callback = vi.fn();

      command.onComplete(callback);
      command.start();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not pass any arguments to callback', () => {
      const command = TestCommand.create(true);
      const callback = vi.fn();

      command.onComplete(callback);
      command.start();

      expect(callback).toHaveBeenCalledWith();
    });
  });

  describe('Callback behavior with stop()', () => {
    it('should NOT fire callback when stop() is called on incomplete command', () => {
      const command = TestCommand.create(false);
      const callback = vi.fn();

      command.onComplete(callback);
      command.start();
      command.stop();

      expect(callback).not.toHaveBeenCalled();
    });

    it('should NOT fire callback when stop() is called on already-completed command', () => {
      const command = TestCommand.create(false);
      const callback = vi.fn();

      command.onComplete(callback);
      command.start();
      command.stop();

      expect(callback).not.toHaveBeenCalled();
      expect(command.isCompleted).toBe(true);
    });

    it('should fire callback when command completes naturally before stop()', () => {
      const command = TestCommand.create(true);
      const callback = vi.fn();

      command.onComplete(callback);
      command.start();

      expect(callback).toHaveBeenCalledTimes(1);

      command.stop();

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Callback behavior with destroy()', () => {
    it('should NOT fire callback when destroy() is called', () => {
      const command = TestCommand.create(false);
      const callback = vi.fn();

      command.onComplete(callback);
      command.destroy();

      expect(callback).not.toHaveBeenCalled();
    });

    it('should clear callbacks on destroy', () => {
      const command = TestCommand.create(false);
      const callback = vi.fn();

      command.onComplete(callback);
      command.destroy();
      command.start();

      expect(callback).not.toHaveBeenCalled();
    });

    it('should not fire callbacks after destroy even if command was completed', () => {
      const command = TestCommand.create(true);
      const callback = vi.fn();

      command.start();
      command.onComplete(callback);
      command.destroy();

      expect(callback).not.toHaveBeenCalled();
    });

    it('should continue firing remaining callbacks if one calls destroy()', () => {
      const command = TestCommand.create(true);
      const callback1 = vi.fn();
      const callback2 = vi.fn(() => command.destroy());
      const callback3 = vi.fn();

      command.onComplete(callback1);
      command.onComplete(callback2);
      command.onComplete(callback3);
      command.start();

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).toHaveBeenCalledTimes(1);
    });
  });

  describe('Callback behavior with restart', () => {
    it('should fire callback again on second completion after restart', () => {
      const command = TestCommand.create(true);
      const callback = vi.fn();

      command.onComplete(callback);
      command.start();
      expect(callback).toHaveBeenCalledTimes(1);

      command.start();
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should maintain registered callbacks across restarts', () => {
      const command = TestCommand.create(true);
      const callback = vi.fn();

      command.onComplete(callback);
      command.start();
      command.start();
      command.start();

      expect(callback).toHaveBeenCalledTimes(3);
    });
  });

  describe('Integration with enumerators', () => {
    it('should fire callbacks in serial command sequences', () => {
      const logs: string[] = [];
      const serial = new SerialCommandEnumerator();

      const cmd1 = TestCommand.create(true);
      cmd1.onComplete(() => logs.push('cmd1 complete'));

      const cmd2 = TestCommand.create(true);
      cmd2.onComplete(() => logs.push('cmd2 complete'));

      const cmd3 = TestCommand.create(true);
      cmd3.onComplete(() => logs.push('cmd3 complete'));

      serial.addCommand(cmd1);
      serial.addCommand(cmd2);
      serial.addCommand(cmd3);

      serial.start();

      expect(logs).toEqual(['cmd1 complete', 'cmd2 complete', 'cmd3 complete']);

      serial.destroy();
    });

    it('should fire callbacks in parallel command sequences', () => {
      const callbacks = {
        cmd1: vi.fn(),
        cmd2: vi.fn(),
        cmd3: vi.fn(),
      };

      const parallel = new ParallelCommandEnumerator();

      const cmd1 = TestCommand.create(true);
      cmd1.onComplete(callbacks.cmd1);

      const cmd2 = TestCommand.create(true);
      cmd2.onComplete(callbacks.cmd2);

      const cmd3 = TestCommand.create(true);
      cmd3.onComplete(callbacks.cmd3);

      parallel.addCommand(cmd1);
      parallel.addCommand(cmd2);
      parallel.addCommand(cmd3);

      parallel.start();

      expect(callbacks.cmd1).toHaveBeenCalledTimes(1);
      expect(callbacks.cmd2).toHaveBeenCalledTimes(1);
      expect(callbacks.cmd3).toHaveBeenCalledTimes(1);

      parallel.destroy();
    });

    it('should fire callback with WaitForTime command', () => {
      const callback = vi.fn();
      const wait = WaitForTime.create(0.1);

      wait.onComplete(callback);
      wait.start();

      expect(callback).not.toHaveBeenCalled();

      wait.update(0.05);
      expect(callback).not.toHaveBeenCalled();

      wait.update(0.05);
      expect(callback).toHaveBeenCalledTimes(1);

      wait.destroy();
    });
  });

  describe('Error handling', () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should handle callback that throws error gracefully', () => {
      const command = TestCommand.create(true);
      const callback = vi.fn(() => {
        throw new Error('Test error');
      });

      command.onComplete(callback);

      expect(() => command.start()).not.toThrow();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should continue firing remaining callbacks even if one throws', () => {
      const command = TestCommand.create(true);
      const callback1 = vi.fn();
      const callback2 = vi.fn(() => {
        throw new Error('Test error');
      });
      const callback3 = vi.fn();

      command.onComplete(callback1);
      command.onComplete(callback2);
      command.onComplete(callback3);
      command.start();

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).toHaveBeenCalledTimes(1);
    });

    it('should log error to console when callback throws', () => {
      const command = TestCommand.create(true);
      const testError = new Error('Test error');
      const callback = vi.fn(() => {
        throw testError;
      });

      command.onComplete(callback);
      command.start();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in command completion callback:',
        testError
      );
    });
  });

  describe('Callback modifying callbacks during execution', () => {
    it('should handle callback registering new callback during execution', () => {
      const command = TestCommand.create(true);
      const callback2 = vi.fn();
      const callback1 = vi.fn(() => {
        command.onComplete(callback2);
      });

      command.onComplete(callback1);
      command.start();

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).not.toHaveBeenCalled();

      command.start();

      expect(callback1).toHaveBeenCalledTimes(2);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should handle callback removing itself during execution', () => {
      const command = TestCommand.create(true);
      const callback1: CompletionCallback = vi.fn(() => {
        command.offComplete(callback1);
      });

      command.onComplete(callback1);
      command.start();

      expect(callback1).toHaveBeenCalledTimes(1);

      command.start();

      expect(callback1).toHaveBeenCalledTimes(1);
    });

    it('should handle callback removing another callback during execution', () => {
      const command = TestCommand.create(true);
      const callback2 = vi.fn();
      const callback1 = vi.fn(() => {
        command.offComplete(callback2);
      });

      command.onComplete(callback1);
      command.onComplete(callback2);
      command.start();

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      command.start();

      expect(callback1).toHaveBeenCalledTimes(2);
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });
});
