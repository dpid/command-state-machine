import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AsyncCommand } from './async-command';
import { SerialCommandEnumerator } from './serial-command-enumerator';
import { ParallelCommandEnumerator } from './parallel-command-enumerator';
import type { Command } from './command.interface';

class TestAsyncCommand extends AsyncCommand {
  public executionCount = 0;

  constructor(
    private promiseFactory: () => Promise<void>,
    private logTarget?: string[]
  ) {
    super();
  }

  protected override async onExecuteAsync(): Promise<void> {
    this.executionCount++;
    if (this.logTarget) {
      this.logTarget.push('executing');
    }
    return this.promiseFactory();
  }

  static create(
    promiseFactory: () => Promise<void>,
    logTarget?: string[]
  ): Command {
    return new TestAsyncCommand(promiseFactory, logTarget);
  }
}

class ImmediateCommand extends AsyncCommand {
  constructor(private logTarget: string[]) {
    super();
  }

  protected override onStart(): void {
    this.logTarget.push('start');
    super.onStart();
  }

  protected override async onExecuteAsync(): Promise<void> {
    this.logTarget.push('execute');
  }

  static create(logTarget: string[]): Command {
    return new ImmediateCommand(logTarget);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('AsyncCommand', () => {
  describe('Unit Tests', () => {
    it('should complete when Promise resolves', async () => {
      const cmd = TestAsyncCommand.create(() => delay(10));

      expect(cmd.isCompleted).toBe(false);

      cmd.start();
      expect(cmd.isCompleted).toBe(false);

      await delay(20);
      expect(cmd.isCompleted).toBe(true);
    });

    it('should complete when Promise rejects and log error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');
      const cmd = TestAsyncCommand.create(() => Promise.reject(error));

      cmd.start();
      expect(cmd.isCompleted).toBe(false);

      await delay(10);

      expect(cmd.isCompleted).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalledWith('AsyncCommand failed:', error);

      consoleErrorSpy.mockRestore();
    });

    it('should handle rejection with no error object', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const cmd = TestAsyncCommand.create(() => Promise.reject(undefined));

      cmd.start();
      await delay(10);

      expect(cmd.isCompleted).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'AsyncCommand failed:',
        'Unknown error'
      );

      consoleErrorSpy.mockRestore();
    });

    it('should ignore completion when stopped before Promise resolves', async () => {
      const cmd = TestAsyncCommand.create(() => delay(20));

      cmd.start();
      expect(cmd.isCompleted).toBe(false);

      cmd.stop();
      expect(cmd.isCompleted).toBe(true);

      await delay(30);
      // Command should remain completed from stop(), not re-completed from Promise
      expect(cmd.isCompleted).toBe(true);
    });

    it('should not cause double completion when stop is called', async () => {
      const cmd = TestAsyncCommand.create(() => delay(20));
      let completionCount = 0;

      cmd.parent = {
        handleCompletedCommand: () => {
          completionCount++;
        },
        update: () => {},
        start: () => {},
        stop: () => {},
        destroy: () => {},
        isCompleted: false,
        parent: null,
        loopCount: 1,
        currentLoop: 0,
        addCommand: () => {},
        removeCommand: () => {},
        hasCommand: () => false,
      };

      cmd.start();
      cmd.stop();

      await delay(30);

      // Should only complete once from stop(), not twice
      expect(completionCount).toBe(1);
    });

    it('should ignore completion when destroyed before Promise resolves', async () => {
      const cmd = TestAsyncCommand.create(() => delay(20));

      cmd.start();
      expect(cmd.isCompleted).toBe(false);

      cmd.destroy();

      await delay(30);
      // Destroy doesn't call complete(), so command stays incomplete
      expect(cmd.isCompleted).toBe(false);
    });

    it('should ignore second start() call while Promise is pending', async () => {
      const cmd = TestAsyncCommand.create(() => delay(20)) as TestAsyncCommand;

      cmd.start();
      expect(cmd.executionCount).toBe(1);

      cmd.start();
      expect(cmd.executionCount).toBe(1); // Should not execute again

      await delay(30);
      expect(cmd.isCompleted).toBe(true);
    });

    it('should allow restart after Promise completes', async () => {
      const cmd = TestAsyncCommand.create(() => delay(10)) as TestAsyncCommand;

      cmd.start();
      await delay(20);
      expect(cmd.isCompleted).toBe(true);
      expect(cmd.executionCount).toBe(1);

      cmd.start();
      await delay(20);
      expect(cmd.isCompleted).toBe(true);
      expect(cmd.executionCount).toBe(2);
    });

    it('should handle synchronous Promise resolution', async () => {
      const cmd = TestAsyncCommand.create(() => Promise.resolve());

      cmd.start();

      // Even with synchronous Promise, completion happens asynchronously
      await delay(5);
      expect(cmd.isCompleted).toBe(true);
    });

    it('should not call update during async execution', async () => {
      const logs: string[] = [];
      const cmd = TestAsyncCommand.create(() => delay(20), logs);

      cmd.start();
      logs.push('after-start');

      cmd.update(0.016);
      cmd.update(0.016);
      cmd.update(0.016);

      expect(logs).toEqual(['executing', 'after-start']);

      await delay(30);
    });
  });

  describe('Serial Enumerator Integration', () => {
    it('should block serial progression until Promise resolves', async () => {
      const logs: string[] = [];
      const serial = new SerialCommandEnumerator();

      serial.addCommand(ImmediateCommand.create(logs));
      serial.addCommand(
        TestAsyncCommand.create(() => delay(20), logs)
      );
      serial.addCommand(ImmediateCommand.create(logs));

      serial.start();
      await Promise.resolve(); // First command completes synchronously

      expect(logs).toEqual(['start', 'execute', 'executing']);

      serial.update(0.016);
      expect(logs).toEqual(['start', 'execute', 'executing']);

      await delay(30);
      expect(logs).toEqual([
        'start',
        'execute',
        'executing',
        'start',
        'execute',
      ]);

      serial.destroy();
    });

    it('should continue serial sequence after Promise rejection', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const logs: string[] = [];
      const serial = new SerialCommandEnumerator();

      serial.addCommand(ImmediateCommand.create(logs));
      serial.addCommand(
        TestAsyncCommand.create(() => Promise.reject(new Error('fail')), logs)
      );
      serial.addCommand(ImmediateCommand.create(logs));

      serial.start();
      await Promise.resolve();

      expect(logs).toEqual(['start', 'execute', 'executing']);

      await delay(20);

      expect(logs).toEqual([
        'start',
        'execute',
        'executing',
        'start',
        'execute',
      ]);

      serial.destroy();
      consoleErrorSpy.mockRestore();
    });

    it('should stop async command when serial enumerator is stopped', async () => {
      const logs: string[] = [];
      const serial = new SerialCommandEnumerator();

      serial.addCommand(ImmediateCommand.create(logs));
      serial.addCommand(
        TestAsyncCommand.create(() => delay(50), logs)
      );
      serial.addCommand(ImmediateCommand.create(logs));

      serial.start();
      await Promise.resolve();

      expect(logs).toEqual(['start', 'execute', 'executing']);

      serial.stop();

      await delay(60);

      // Third command should not execute
      expect(logs).toEqual(['start', 'execute', 'executing']);

      serial.destroy();
    });
  });

  describe('Parallel Enumerator Integration', () => {
    it('should execute multiple async commands in parallel', async () => {
      const logs: string[] = [];
      const parallel = new ParallelCommandEnumerator();

      parallel.addCommand(
        TestAsyncCommand.create(async () => {
          await delay(20);
          logs.push('cmd1');
        })
      );
      parallel.addCommand(
        TestAsyncCommand.create(async () => {
          await delay(10);
          logs.push('cmd2');
        })
      );
      parallel.addCommand(
        TestAsyncCommand.create(async () => {
          await delay(15);
          logs.push('cmd3');
        })
      );

      parallel.start();
      expect(parallel.isCompleted).toBe(false);

      await delay(30);

      expect(parallel.isCompleted).toBe(true);
      // Commands complete in their own timing order
      expect(logs).toContain('cmd1');
      expect(logs).toContain('cmd2');
      expect(logs).toContain('cmd3');

      parallel.destroy();
    });

    it('should wait for all async commands before completing', async () => {
      const parallel = new ParallelCommandEnumerator();

      parallel.addCommand(TestAsyncCommand.create(() => delay(10)));
      parallel.addCommand(TestAsyncCommand.create(() => delay(20)));
      parallel.addCommand(TestAsyncCommand.create(() => delay(30)));

      parallel.start();
      expect(parallel.isCompleted).toBe(false);

      await delay(15);
      expect(parallel.isCompleted).toBe(false);

      await delay(10);
      expect(parallel.isCompleted).toBe(false);

      await delay(10);
      expect(parallel.isCompleted).toBe(true);

      parallel.destroy();
    });

    it('should handle rejection in parallel without affecting other commands', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const logs: string[] = [];
      const parallel = new ParallelCommandEnumerator();

      parallel.addCommand(
        TestAsyncCommand.create(async () => {
          await delay(10);
          logs.push('success1');
        })
      );
      parallel.addCommand(
        TestAsyncCommand.create(() => Promise.reject(new Error('fail')))
      );
      parallel.addCommand(
        TestAsyncCommand.create(async () => {
          await delay(20);
          logs.push('success2');
        })
      );

      parallel.start();

      await delay(30);

      expect(parallel.isCompleted).toBe(true);
      expect(logs).toEqual(['success1', 'success2']);

      parallel.destroy();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle immediately resolved Promise', async () => {
      const cmd = TestAsyncCommand.create(() => Promise.resolve());

      cmd.start();

      await delay(5);
      expect(cmd.isCompleted).toBe(true);
    });

    it('should handle Promise that never resolves (timeout scenario)', async () => {
      const cmd = TestAsyncCommand.create(
        () => new Promise(() => {}) // Never resolves
      );

      cmd.start();

      await delay(50);
      expect(cmd.isCompleted).toBe(false);

      cmd.stop();
      expect(cmd.isCompleted).toBe(true);
    });

    it('should handle errors thrown synchronously in onExecuteAsync', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      class ThrowingCommand extends AsyncCommand {
        protected override async onExecuteAsync(): Promise<void> {
          throw new Error('Sync error');
        }

        static create(): Command {
          return new ThrowingCommand();
        }
      }

      const cmd = ThrowingCommand.create();
      cmd.start();

      await delay(10);

      expect(cmd.isCompleted).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should reset isExecuting flag after completion for restartability', async () => {
      const cmd = TestAsyncCommand.create(() => delay(10)) as TestAsyncCommand;

      cmd.start();
      expect(cmd.executionCount).toBe(1);

      await delay(20);
      expect(cmd.isCompleted).toBe(true);

      // Should be able to restart
      cmd.start();
      expect(cmd.executionCount).toBe(2);

      await delay(20);
      expect(cmd.isCompleted).toBe(true);
    });

    it('should reset isExecuting flag after rejection for restartability', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      let shouldReject = true;

      const cmd = TestAsyncCommand.create(() =>
        shouldReject ? Promise.reject(new Error('fail')) : Promise.resolve()
      ) as TestAsyncCommand;

      cmd.start();
      await delay(10);
      expect(cmd.isCompleted).toBe(true);
      expect(cmd.executionCount).toBe(1);

      shouldReject = false;
      cmd.start();
      await delay(10);
      expect(cmd.isCompleted).toBe(true);
      expect(cmd.executionCount).toBe(2);

      consoleErrorSpy.mockRestore();
    });
  });
});
