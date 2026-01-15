import { describe, it, expect, vi } from 'vitest';
import {
  StateMachine,
  SimpleState,
  CommandableState,
  AbstractCommand,
  SerialCommandEnumerator,
  ParallelCommandEnumerator,
  WaitForTime,
  CallTransition,
  type Command,
} from '../src';

class LogCommand extends AbstractCommand {
  public logs: string[] = [];

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

describe('StateMachine', () => {
  it('should transition between states', () => {
    const sm = StateMachine.create();
    const stateChanges: string[] = [];

    const stateA = SimpleState.create('StateA');
    const stateB = SimpleState.create('StateB');

    stateA.addTransition('next', stateB);
    stateB.addTransition('back', stateA);

    sm.addState(stateA);
    sm.addState(stateB);

    sm.addStateChangeListener((name) => stateChanges.push(name));

    sm.setState('StateA');
    sm.handleTransition('next');
    sm.handleTransition('back');

    expect(stateChanges).toEqual(['StateA', 'StateB', 'StateA']);

    sm.destroy();
  });
});

describe('CommandableState', () => {
  it('should execute serial commands on enter', async () => {
    const logs: string[] = [];
    const state = CommandableState.create('TestState');

    state.addCommand(LogCommand.create('First command', logs));
    state.addCommand(LogCommand.create('Second command', logs));
    state.addCommand(LogCommand.create('Third command', logs));

    state.enterState();

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(logs).toEqual(['First command', 'Second command', 'Third command']);

    state.exitState();
    state.destroy();
  });
});

describe('WaitForTime', () => {
  it('should complete after accumulated delta time', () => {
    const logs: string[] = [];
    const serial = new SerialCommandEnumerator();

    serial.addCommand(LogCommand.create('Before', logs));
    serial.addCommand(WaitForTime.create(0.1));
    serial.addCommand(LogCommand.create('After', logs));

    serial.start();
    expect(logs).toEqual(['Before']);

    serial.update(0.05);
    expect(logs).toEqual(['Before']);

    serial.update(0.05);
    expect(logs).toEqual(['Before', 'After']);

    serial.destroy();
  });

  it('should handle large delta time overshoots', () => {
    const serial = new SerialCommandEnumerator();
    serial.addCommand(WaitForTime.create(0.1));

    serial.start();
    expect(serial.isCompleted).toBe(false);

    serial.update(0.2);
    expect(serial.isCompleted).toBe(true);

    serial.destroy();
  });
});

describe('ParallelCommandEnumerator', () => {
  it('should execute commands in parallel', async () => {
    const logs: string[] = [];
    const parallel = new ParallelCommandEnumerator();

    const serial1 = new SerialCommandEnumerator();
    serial1.addCommand(LogCommand.create('Parallel A - Step 1', logs));
    serial1.addCommand(LogCommand.create('Parallel A - Step 2', logs));

    const serial2 = new SerialCommandEnumerator();
    serial2.addCommand(LogCommand.create('Parallel B - Step 1', logs));
    serial2.addCommand(LogCommand.create('Parallel B - Step 2', logs));

    parallel.addCommand(serial1);
    parallel.addCommand(serial2);

    parallel.start();

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(logs).toContain('Parallel A - Step 1');
    expect(logs).toContain('Parallel B - Step 1');
    expect(logs.length).toBe(4);

    parallel.destroy();
  });
});

describe('Layered Commands', () => {
  it('should execute commands on specific layers', async () => {
    const logs: string[] = [];
    const state = CommandableState.create('LayeredState');

    state.addCommandToLayer(LogCommand.create('Layer 0 - Command 1', logs), 0);
    state.addCommandToLayer(LogCommand.create('Layer 0 - Command 2', logs), 0);
    state.addCommandToLayer(LogCommand.create('Layer 1 - Command 1', logs), 1);
    state.addCommandToLayer(LogCommand.create('Layer 1 - Command 2', logs), 1);

    state.enterState();

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(logs.length).toBe(4);
    expect(logs).toContain('Layer 0 - Command 1');
    expect(logs).toContain('Layer 1 - Command 1');

    state.destroy();
  });
});

describe('CallTransition', () => {
  it('should trigger state transitions from commands', async () => {
    const stateChanges: string[] = [];
    const sm = StateMachine.create();

    const stateA = CommandableState.create('StateA');
    const stateB = CommandableState.create('StateB');
    const stateC = SimpleState.create('StateC');

    stateA.addTransition('goToB', stateB);
    stateB.addTransition('goToC', stateC);

    sm.addState(stateA);
    sm.addState(stateB);
    sm.addState(stateC);

    sm.addStateChangeListener((name) => stateChanges.push(name));

    const logs: string[] = [];
    stateA.addCommand(LogCommand.create('StateA: Starting', logs));
    stateA.addCommand(CallTransition.create(stateA, 'goToB'));

    stateB.addCommand(LogCommand.create('StateB: Starting', logs));
    stateB.addCommand(CallTransition.create(stateB, 'goToC'));

    sm.setState('StateA');

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(stateChanges).toEqual(['StateA', 'StateB', 'StateC']);
    expect(sm.currentState?.stateName).toBe('StateC');

    sm.destroy();
  });
});

describe('Game Loop Integration', () => {
  class TrackingCommand extends AbstractCommand {
    public updateCalls: number[] = [];

    protected override onUpdate(dt: number): void {
      this.updateCalls.push(dt);
    }
  }

  it('should propagate update through command hierarchy', () => {
    const command = new TrackingCommand();
    const state = CommandableState.create('TestState');
    const sm = StateMachine.create();

    sm.addState(state);
    state.addCommand(command);

    sm.setState('TestState');
    sm.update(0.016);
    sm.update(0.016);

    expect(command.updateCalls).toEqual([0.016, 0.016]);

    sm.destroy();
  });

  it('should not update completed commands', () => {
    class ImmediateCompleteCommand extends AbstractCommand {
      public updateCalls: number[] = [];

      protected override onStart(): void {
        this.complete();
      }

      protected override onUpdate(dt: number): void {
        this.updateCalls.push(dt);
      }
    }

    const command = new ImmediateCompleteCommand();
    const serial = new SerialCommandEnumerator();
    serial.addCommand(command);

    serial.start();
    serial.update(0.016);

    expect(command.updateCalls).toEqual([]);

    serial.destroy();
  });

  it('should only update current command in serial enumerator', () => {
    const command1 = new TrackingCommand();
    const command2 = new TrackingCommand();

    const serial = new SerialCommandEnumerator();
    serial.addCommand(command1);
    serial.addCommand(command2);

    serial.start();
    serial.update(0.016);

    expect(command1.updateCalls).toEqual([0.016]);
    expect(command2.updateCalls).toEqual([]);

    serial.destroy();
  });

  it('should update all active commands in parallel enumerator', () => {
    const command1 = new TrackingCommand();
    const command2 = new TrackingCommand();

    const parallel = new ParallelCommandEnumerator();
    parallel.addCommand(command1);
    parallel.addCommand(command2);

    parallel.start();
    parallel.update(0.016);

    expect(command1.updateCalls).toEqual([0.016]);
    expect(command2.updateCalls).toEqual([0.016]);

    parallel.destroy();
  });
});
