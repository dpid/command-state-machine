import {
  StateMachine,
  SimpleState,
  CommandableState,
  AbstractCommand,
  SerialCommandEnumerator,
  ParallelCommandEnumerator,
  WaitForTime,
  CallTransition,
  type ICommand,
} from './src';

class LogCommand extends AbstractCommand {
  constructor(private message: string) {
    super();
  }

  protected override onStart(): void {
    console.log(`  [LogCommand] ${this.message}`);
    this.complete();
  }

  static create(message: string): ICommand {
    return new LogCommand(message);
  }
}

async function testBasicStateMachine(): Promise<void> {
  console.log('Test 1: Basic State Machine');

  const sm = StateMachine.create();

  const stateA = SimpleState.create('StateA');
  const stateB = SimpleState.create('StateB');

  stateA.addTransition('next', stateB);
  stateB.addTransition('back', stateA);

  sm.addState(stateA);
  sm.addState(stateB);

  sm.onStateChange((name) => console.log(`  State changed to: ${name}`));

  sm.setState('StateA');
  sm.handleTransition('next');
  sm.handleTransition('back');

  sm.destroy();
  console.log('  PASSED\n');
}

async function testCommandableState(): Promise<void> {
  console.log('Test 2: CommandableState with Serial Commands');

  const state = CommandableState.create('TestState');

  state.addCommand(LogCommand.create('First command'));
  state.addCommand(LogCommand.create('Second command'));
  state.addCommand(LogCommand.create('Third command'));

  state.enterState();

  await new Promise((resolve) => setTimeout(resolve, 50));

  state.exitState();
  state.destroy();
  console.log('  PASSED\n');
}

async function testWaitForTime(): Promise<void> {
  console.log('Test 3: WaitForTime Command');

  const state = CommandableState.create('TimedState');

  const start = Date.now();

  state.addCommand(LogCommand.create('Before wait'));
  state.addCommand(WaitForTime.create(100));
  state.addCommand(LogCommand.create('After wait'));

  state.enterState();

  await new Promise((resolve) => setTimeout(resolve, 200));

  const elapsed = Date.now() - start;
  console.log(`  Elapsed time: ${elapsed}ms (expected ~100ms+)`);

  state.destroy();
  console.log('  PASSED\n');
}

async function testParallelCommands(): Promise<void> {
  console.log('Test 4: Parallel Commands');

  const parallel = new ParallelCommandEnumerator();

  const serial1 = new SerialCommandEnumerator();
  serial1.addCommand(LogCommand.create('Parallel A - Step 1'));
  serial1.addCommand(LogCommand.create('Parallel A - Step 2'));

  const serial2 = new SerialCommandEnumerator();
  serial2.addCommand(LogCommand.create('Parallel B - Step 1'));
  serial2.addCommand(LogCommand.create('Parallel B - Step 2'));

  parallel.addCommand(serial1);
  parallel.addCommand(serial2);

  parallel.start();

  await new Promise((resolve) => setTimeout(resolve, 50));

  parallel.destroy();
  console.log('  PASSED\n');
}

async function testLayeredCommands(): Promise<void> {
  console.log('Test 5: Layered Commands in CommandableState');

  const state = CommandableState.create('LayeredState');

  state.addCommandToLayer(LogCommand.create('Layer 0 - Command 1'), 0);
  state.addCommandToLayer(LogCommand.create('Layer 0 - Command 2'), 0);
  state.addCommandToLayer(LogCommand.create('Layer 1 - Command 1'), 1);
  state.addCommandToLayer(LogCommand.create('Layer 1 - Command 2'), 1);

  state.enterState();

  await new Promise((resolve) => setTimeout(resolve, 50));

  state.destroy();
  console.log('  PASSED\n');
}

async function testCallTransition(): Promise<void> {
  console.log('Test 6: CallTransition Command');

  const sm = StateMachine.create();

  const stateA = CommandableState.create('StateA');
  const stateB = CommandableState.create('StateB');
  const stateC = SimpleState.create('StateC');

  stateA.addTransition('goToB', stateB);
  stateB.addTransition('goToC', stateC);

  sm.addState(stateA);
  sm.addState(stateB);
  sm.addState(stateC);

  sm.onStateChange((name) => console.log(`  State changed to: ${name}`));

  stateA.addCommand(LogCommand.create('StateA: Starting'));
  stateA.addCommand(LogCommand.create('StateA: About to transition...'));
  stateA.addCommand(CallTransition.create(stateA, 'goToB'));

  stateB.addCommand(LogCommand.create('StateB: Starting'));
  stateB.addCommand(CallTransition.create(stateB, 'goToC'));

  sm.setState('StateA');

  await new Promise((resolve) => setTimeout(resolve, 100));

  console.log(`  Final state: ${sm.currentState?.stateName}`);

  sm.destroy();
  console.log('  PASSED\n');
}

async function main(): Promise<void> {
  console.log('=== Command State Machine Tests ===\n');

  await testBasicStateMachine();
  await testCommandableState();
  await testWaitForTime();
  await testParallelCommands();
  await testLayeredCommands();
  await testCallTransition();

  console.log('=== All Tests Passed ===');
}

main().catch(console.error);
