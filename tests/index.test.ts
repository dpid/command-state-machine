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

    sm.onStateChange((name) => stateChanges.push(name));

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
  it('should wait for specified duration', async () => {
    const logs: string[] = [];
    const state = CommandableState.create('TimedState');

    state.addCommand(LogCommand.create('Before wait', logs));
    state.addCommand(WaitForTime.create(100));
    state.addCommand(LogCommand.create('After wait', logs));

    const start = Date.now();
    state.enterState();

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(logs).toEqual(['Before wait']);

    await new Promise((resolve) => setTimeout(resolve, 100));
    const elapsed = Date.now() - start;

    expect(logs).toEqual(['Before wait', 'After wait']);
    expect(elapsed).toBeGreaterThanOrEqual(100);

    state.destroy();
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

    sm.onStateChange((name) => stateChanges.push(name));

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
