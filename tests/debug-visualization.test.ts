import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AbstractCommand } from '../src/commands/abstract-command';
import { CommandPlayer } from '../src/commands/command-player.class';
import { WaitForTime } from '../src/commands/wait-for-time';
import { CallTransition } from '../src/commands/call-transition';
import { SerialCommandEnumerator } from '../src/commands/serial-command-enumerator';
import { ParallelCommandEnumerator } from '../src/commands/parallel-command-enumerator';
import { StateMachine } from '../src/states/state-machine.class';
import { SimpleState } from '../src/states/simple-state';
import type { Command } from '../src/commands/command.interface';

class TestCommand extends AbstractCommand {
  protected override onStart(): void {
    // Command stays running
  }
}

describe('Debug Visualization', () => {
  describe('Elapsed Time Tracking', () => {
    it('should return null for elapsed time when command not started', () => {
      const command = new TestCommand();
      expect(command.getElapsedTime()).toBeNull();
    });

    it('should track elapsed time after command starts', () => {
      const command = new TestCommand();
      command.start();

      const elapsed = command.getElapsedTime();
      expect(elapsed).not.toBeNull();
      expect(elapsed).toBeGreaterThanOrEqual(0);
    });

    it('should increase elapsed time during execution', () => {
      const command = new TestCommand();
      command.start();

      const elapsed1 = command.getElapsedTime();

      // Simulate time passing
      const delay = 10;
      const startTime = Date.now();
      while (Date.now() - startTime < delay) {
        // Busy wait
      }

      const elapsed2 = command.getElapsedTime();
      expect(elapsed2).toBeGreaterThan(elapsed1!);
    });

    it('should freeze elapsed time after completion', () => {
      const command = new TestCommand();
      command.start();
      command.stop();

      const elapsed1 = command.getElapsedTime();

      // Simulate time passing
      const delay = 10;
      const startTime = Date.now();
      while (Date.now() - startTime < delay) {
        // Busy wait
      }

      const elapsed2 = command.getElapsedTime();
      expect(elapsed2).toBe(elapsed1);
    });
  });

  describe('Debug Status Labels', () => {
    it('should show pending status for unstarted command', () => {
      const command = new TestCommand();
      const dump = command['debugDumpTree']('', 0);
      expect(dump).toContain('[pending]');
    });

    it('should show running status for started command', () => {
      const command = new TestCommand();
      command.start();
      const dump = command['debugDumpTree']('', 0);
      expect(dump).toContain('[running]');
    });

    it('should show completed status for stopped command', () => {
      const command = new TestCommand();
      command.start();
      command.stop();
      const dump = command['debugDumpTree']('', 0);
      expect(dump).toContain('[completed]');
    });
  });

  describe('Command Debug Names', () => {
    it('should show WaitForTime with duration in milliseconds', () => {
      const wait = WaitForTime.create(1.5) as AbstractCommand;
      wait.start();
      const dump = wait['debugDumpTree']('', 0);
      expect(dump).toContain('WaitForTime (1500ms)');
    });

    it('should show CallTransition with transition name', () => {
      const handler = { handleTransition: vi.fn() };
      const call = CallTransition.create(handler, 'next') as AbstractCommand;
      call.start();
      const dump = call['debugDumpTree']('', 0);
      expect(dump).toContain('CallTransition -> next');
    });

    it('should show constructor name for custom commands', () => {
      const command = new TestCommand();
      command.start();
      const dump = command['debugDumpTree']('', 0);
      expect(dump).toContain('TestCommand');
    });
  });

  describe('Tree Indentation', () => {
    it('should indent nested commands with 2 spaces per level', () => {
      const enumerator = new SerialCommandEnumerator();
      const child = new TestCommand();
      enumerator.addCommand(child);
      enumerator.start();

      const dump = enumerator['debugDumpTree']('', 0);
      const lines = dump.split('\n');

      expect(lines[0]).toMatch(/^SerialCommandEnumerator/);
      expect(lines[1]).toMatch(/^  TestCommand/);
    });

    it('should handle multiple levels of nesting', () => {
      const outer = new SerialCommandEnumerator();
      const inner = new SerialCommandEnumerator();
      const command = new TestCommand();

      inner.addCommand(command);
      outer.addCommand(inner);
      outer.start();

      const dump = outer['debugDumpTree']('', 0);
      const lines = dump.split('\n');

      expect(lines[0]).toMatch(/^SerialCommandEnumerator/);
      expect(lines[1]).toMatch(/^  SerialCommandEnumerator/);
      expect(lines[2]).toMatch(/^    TestCommand/);
    });
  });

  describe('Serial Command Enumerator', () => {
    it('should show current command position', () => {
      const enumerator = new SerialCommandEnumerator();
      enumerator.addCommand(new TestCommand());
      enumerator.addCommand(new TestCommand());
      enumerator.addCommand(new TestCommand());
      enumerator.start();

      const dump = enumerator['debugDumpTree']('', 0);
      expect(dump).toContain('(cmd 1/3)');
    });

    it('should show loop information when looping', () => {
      const enumerator = new SerialCommandEnumerator();
      enumerator.loopCount = 3;
      enumerator.addCommand(new TestCommand());
      enumerator.start();

      const dump = enumerator['debugDumpTree']('', 0);
      expect(dump).toContain('loop 1/3');
    });

    it('should show infinite loop indicator', () => {
      const enumerator = new SerialCommandEnumerator();
      enumerator.loopCount = -1;
      enumerator.addCommand(new TestCommand());
      enumerator.start();

      const dump = enumerator['debugDumpTree']('', 0);
      expect(dump).toContain('infinite loop');
    });
  });

  describe('Parallel Command Enumerator', () => {
    it('should show all parallel commands', () => {
      const enumerator = new ParallelCommandEnumerator();
      enumerator.addCommand(new TestCommand());
      enumerator.addCommand(new TestCommand());
      enumerator.start();

      const dump = enumerator['debugDumpTree']('', 0);
      const lines = dump.split('\n');

      expect(lines.length).toBe(3); // Parent + 2 children
      expect(lines[0]).toContain('ParallelCommandEnumerator');
      expect(lines[1]).toContain('TestCommand');
      expect(lines[2]).toContain('TestCommand');
    });

    it('should show loop information when looping', () => {
      const enumerator = new ParallelCommandEnumerator();
      enumerator.loopCount = 2;
      enumerator.addCommand(new TestCommand());
      enumerator.start();

      const dump = enumerator['debugDumpTree']('', 0);
      expect(dump).toContain('loop 1/2');
    });
  });

  describe('CommandPlayer debugDump', () => {
    it('should return empty tree for player with no commands', () => {
      const player = new CommandPlayer();
      const dump = player.debugDump();
      expect(dump).toContain('CommandPlayer');
    });

    it('should show single layer with commands', () => {
      const player = new CommandPlayer();
      player.addCommand(new TestCommand());
      player.addCommand(new TestCommand());
      player.start();

      const dump = player.debugDump();
      expect(dump).toContain('CommandPlayer');
      expect(dump).toContain('ParallelCommandEnumerator');
      expect(dump).toContain('SerialCommandEnumerator');
      expect(dump).toContain('TestCommand');
    });

    it('should show multiple layers', () => {
      const player = new CommandPlayer();
      player.addCommand(new TestCommand(), 0);
      player.addCommand(new TestCommand(), 1);
      player.start();

      const dump = player.debugDump();
      const lines = dump.split('\n');

      // Count SerialCommandEnumerator lines (one per layer)
      const layerLines = lines.filter(line => line.includes('SerialCommandEnumerator'));
      expect(layerLines.length).toBe(2);
    });

    it('should show loop information for player', () => {
      const player = new CommandPlayer();
      player.loopCount = 3;
      player.addCommand(new TestCommand());
      player.start();

      const dump = player.debugDump();
      expect(dump).toContain('CommandPlayer');
      expect(dump).toContain('loop 1/3');
    });

    it('should show elapsed time for commands in tree', () => {
      const player = new CommandPlayer();
      player.addCommand(WaitForTime.create(0.1));
      player.start();

      // Let some time pass
      const dt = 0.016; // 60fps frame
      player.update(dt);

      const dump = player.debugDump();
      expect(dump).toContain('elapsed');
      expect(dump).toContain('ms');
    });
  });

  describe('StateMachine Debug Mode', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should not log when debug mode is disabled', () => {
      const machine = StateMachine.create();
      const state1 = SimpleState.create('state1');
      const state2 = SimpleState.create('state2');

      machine.addState(state1);
      machine.addState(state2);
      machine.setState(state1);
      machine.setState(state2);

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should log state transitions when debug mode is enabled', () => {
      const machine = StateMachine.create();
      machine.setDebugMode(true);

      const state1 = SimpleState.create('state1');
      const state2 = SimpleState.create('state2');

      machine.addState(state1);
      machine.addState(state2);
      machine.setState(state1);
      machine.setState(state2);

      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenCalledWith('[StateMachine]', 'state1', '@', expect.any(Number));
      expect(consoleSpy).toHaveBeenCalledWith('[StateMachine]', 'state2', '@', expect.any(Number));
    });

    it('should include timestamps in debug logs', () => {
      const machine = StateMachine.create();
      machine.setDebugMode(true);

      const state = SimpleState.create('state1');
      machine.addState(state);

      const timeBefore = Date.now();
      machine.setState(state);
      const timeAfter = Date.now();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[StateMachine]',
        'state1',
        '@',
        expect.any(Number)
      );

      const timestamp = consoleSpy.mock.calls[0][3] as number;
      expect(timestamp).toBeGreaterThanOrEqual(timeBefore);
      expect(timestamp).toBeLessThanOrEqual(timeAfter);
    });

    it('should log hierarchical state transitions', () => {
      const machine = StateMachine.create();
      machine.setDebugMode(true);

      const parent = SimpleState.create('parent');
      const child = SimpleState.create('child');
      parent.addSubstate(child);
      machine.addState(parent);

      machine.setState('parent.child');

      expect(consoleSpy).toHaveBeenCalledWith('[StateMachine]', 'child', '@', expect.any(Number));
    });

    it('should allow toggling debug mode on and off', () => {
      const machine = StateMachine.create();
      const state1 = SimpleState.create('state1');
      const state2 = SimpleState.create('state2');
      const state3 = SimpleState.create('state3');

      machine.addState(state1);
      machine.addState(state2);
      machine.addState(state3);

      machine.setState(state1);
      expect(consoleSpy).not.toHaveBeenCalled();

      machine.setDebugMode(true);
      machine.setState(state2);
      expect(consoleSpy).toHaveBeenCalledTimes(1);

      machine.setDebugMode(false);
      machine.setState(state3);
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration Tests', () => {
    it('should show complete command hierarchy in realistic scenario', () => {
      const player = new CommandPlayer();

      // Layer 0: Sequential animations
      player.addCommand(WaitForTime.create(0.5), 0);
      player.addCommand(WaitForTime.create(1.0), 0);

      // Layer 1: Parallel background tasks
      const parallelTasks = new ParallelCommandEnumerator();
      parallelTasks.addCommand(WaitForTime.create(2.0));
      parallelTasks.addCommand(WaitForTime.create(2.0));
      player.addCommand(parallelTasks, 1);

      player.start();

      const dump = player.debugDump();

      expect(dump).toContain('CommandPlayer [running]');
      expect(dump).toContain('ParallelCommandEnumerator');
      expect(dump).toContain('SerialCommandEnumerator');
      expect(dump).toContain('WaitForTime (500ms)');
      expect(dump).toContain('WaitForTime (1000ms)');
      expect(dump).toContain('WaitForTime (2000ms)');
    });

    it('should show progression of command execution', () => {
      const player = new CommandPlayer();
      player.addCommand(WaitForTime.create(0.1));
      player.addCommand(WaitForTime.create(0.1));
      player.start();

      const dump1 = player.debugDump();
      expect(dump1).toMatch(/WaitForTime.*\[running\]/);
      expect(dump1).toMatch(/WaitForTime.*\[pending\]/);

      // Complete first command
      player.update(0.2);

      const dump2 = player.debugDump();
      expect(dump2).toMatch(/WaitForTime.*\[completed\]/);
      expect(dump2).toMatch(/WaitForTime.*\[running\]/);
    });

    it('should handle deeply nested command structures', () => {
      const player = new CommandPlayer();

      const outer = new SerialCommandEnumerator();
      const middle = new ParallelCommandEnumerator();
      const inner = new SerialCommandEnumerator();

      inner.addCommand(new TestCommand());
      middle.addCommand(inner);
      outer.addCommand(middle);
      player.addCommand(outer);

      player.start();

      const dump = player.debugDump();
      const lines = dump.split('\n');

      // Verify indentation increases properly
      expect(lines.some(line => line.match(/^CommandPlayer/))).toBe(true);
      expect(lines.some(line => line.match(/^  ParallelCommandEnumerator/))).toBe(true);
      expect(lines.some(line => line.match(/^    SerialCommandEnumerator/))).toBe(true);
      expect(lines.some(line => line.match(/^      SerialCommandEnumerator/))).toBe(true);
      expect(lines.some(line => line.match(/^        ParallelCommandEnumerator/))).toBe(true);
      expect(lines.some(line => line.match(/^          SerialCommandEnumerator/))).toBe(true);
      expect(lines.some(line => line.match(/^            TestCommand/))).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle command that completes instantly', () => {
      const handler = { handleTransition: vi.fn() };
      const call = CallTransition.create(handler, 'next') as Command;

      const player = new CommandPlayer();
      player.addCommand(call);
      player.start();

      const dump = player.debugDump();
      expect(dump).toContain('[completed]');
      expect(dump).toContain('elapsed');
    });

    it('should handle empty enumerator', () => {
      const enumerator = new SerialCommandEnumerator();
      enumerator.start();

      const dump = enumerator['debugDumpTree']('', 0);
      expect(dump).toContain('SerialCommandEnumerator');
      expect(dump).toContain('(cmd 1/0)');
    });

    it('should handle command that never completes', () => {
      const longRunning = new TestCommand();
      longRunning.start();

      // Simulate multiple updates
      for (let i = 0; i < 10; i++) {
        longRunning.update(0.016);
      }

      const dump = longRunning['debugDumpTree']('', 0);
      expect(dump).toContain('[running]');
      expect(dump).toContain('elapsed');

      const elapsed = longRunning.getElapsedTime();
      expect(elapsed).not.toBeNull();
      expect(elapsed).toBeGreaterThan(0);
    });
  });
});
