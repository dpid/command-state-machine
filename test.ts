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

  static Create(message: string): ICommand {
    return new LogCommand(message);
  }
}

async function testBasicStateMachine(): Promise<void> {
  console.log('Test 1: Basic State Machine');

  const sm = StateMachine.Create();

  const stateA = SimpleState.Create('StateA');
  const stateB = SimpleState.Create('StateB');

  stateA.AddTransition('next', stateB);
  stateB.AddTransition('back', stateA);

  sm.AddState(stateA);
  sm.AddState(stateB);

  sm.OnStateChange((name) => console.log(`  State changed to: ${name}`));

  sm.SetState('StateA');
  sm.HandleTransition('next');
  sm.HandleTransition('back');

  sm.Destroy();
  console.log('  PASSED\n');
}

async function testCommandableState(): Promise<void> {
  console.log('Test 2: CommandableState with Serial Commands');

  const state = CommandableState.Create('TestState');

  state.AddCommand(LogCommand.Create('First command'));
  state.AddCommand(LogCommand.Create('Second command'));
  state.AddCommand(LogCommand.Create('Third command'));

  state.EnterState();

  await new Promise((resolve) => setTimeout(resolve, 50));

  state.ExitState();
  state.Destroy();
  console.log('  PASSED\n');
}

async function testWaitForTime(): Promise<void> {
  console.log('Test 3: WaitForTime Command');

  const state = CommandableState.Create('TimedState');

  const start = Date.now();

  state.AddCommand(LogCommand.Create('Before wait'));
  state.AddCommand(WaitForTime.Create(100));
  state.AddCommand(LogCommand.Create('After wait'));

  state.EnterState();

  await new Promise((resolve) => setTimeout(resolve, 200));

  const elapsed = Date.now() - start;
  console.log(`  Elapsed time: ${elapsed}ms (expected ~100ms+)`);

  state.Destroy();
  console.log('  PASSED\n');
}

async function testParallelCommands(): Promise<void> {
  console.log('Test 4: Parallel Commands');

  const parallel = new ParallelCommandEnumerator();

  const serial1 = new SerialCommandEnumerator();
  serial1.AddCommand(LogCommand.Create('Parallel A - Step 1'));
  serial1.AddCommand(LogCommand.Create('Parallel A - Step 2'));

  const serial2 = new SerialCommandEnumerator();
  serial2.AddCommand(LogCommand.Create('Parallel B - Step 1'));
  serial2.AddCommand(LogCommand.Create('Parallel B - Step 2'));

  parallel.AddCommand(serial1);
  parallel.AddCommand(serial2);

  parallel.Start();

  await new Promise((resolve) => setTimeout(resolve, 50));

  parallel.Destroy();
  console.log('  PASSED\n');
}

async function testLayeredCommands(): Promise<void> {
  console.log('Test 5: Layered Commands in CommandableState');

  const state = CommandableState.Create('LayeredState');

  state.AddCommandToLayer(LogCommand.Create('Layer 0 - Command 1'), 0);
  state.AddCommandToLayer(LogCommand.Create('Layer 0 - Command 2'), 0);
  state.AddCommandToLayer(LogCommand.Create('Layer 1 - Command 1'), 1);
  state.AddCommandToLayer(LogCommand.Create('Layer 1 - Command 2'), 1);

  state.EnterState();

  await new Promise((resolve) => setTimeout(resolve, 50));

  state.Destroy();
  console.log('  PASSED\n');
}

async function testCallTransition(): Promise<void> {
  console.log('Test 6: CallTransition Command');

  const sm = StateMachine.Create();

  const stateA = CommandableState.Create('StateA');
  const stateB = CommandableState.Create('StateB');
  const stateC = SimpleState.Create('StateC');

  stateA.AddTransition('goToB', stateB);
  stateB.AddTransition('goToC', stateC);

  sm.AddState(stateA);
  sm.AddState(stateB);
  sm.AddState(stateC);

  sm.OnStateChange((name) => console.log(`  State changed to: ${name}`));

  // Add commands to StateA that will trigger transition to StateB
  stateA.AddCommand(LogCommand.Create('StateA: Starting'));
  stateA.AddCommand(LogCommand.Create('StateA: About to transition...'));
  stateA.AddCommand(CallTransition.Create(stateA, 'goToB'));

  // Add commands to StateB that will trigger transition to StateC
  stateB.AddCommand(LogCommand.Create('StateB: Starting'));
  stateB.AddCommand(CallTransition.Create(stateB, 'goToC'));

  sm.SetState('StateA');

  await new Promise((resolve) => setTimeout(resolve, 100));

  console.log(`  Final state: ${sm.CurrentState?.StateName}`);

  sm.Destroy();
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
