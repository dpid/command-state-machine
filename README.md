# @dpid/command-state-machine

A command-driven state machine for TypeScript. Execute sequences of commands when entering states, with support for serial, parallel, and layered command execution.

## Installation

```bash
npm install @dpid/command-state-machine
```

## Quick Start

```typescript
import { StateMachine, SimpleState, CommandableState, WaitForTime, AbstractCommand } from '@dpid/command-state-machine';

// Create a state machine
const sm = StateMachine.Create();

// Add states
const idle = SimpleState.Create('idle');
const running = SimpleState.Create('running');

// Define transitions
idle.AddTransition('start', running);
running.AddTransition('stop', idle);

sm.AddState(idle);
sm.AddState(running);

// Listen for state changes
sm.OnStateChange((stateName) => {
  console.log(`State: ${stateName}`);
});

// Set initial state and trigger transitions
sm.SetState('idle');
sm.HandleTransition('start'); // -> running
sm.HandleTransition('stop');  // -> idle
```

## Creating Custom Commands

Extend `AbstractCommand` to create commands that execute when a state is entered:

```typescript
import { AbstractCommand, ICommand } from '@dpid/command-state-machine';

class LogCommand extends AbstractCommand {
  constructor(private message: string) {
    super();
  }

  protected onStart(): void {
    console.log(this.message);
    this.complete(); // Signal completion
  }

  static Create(message: string): ICommand {
    return new LogCommand(message);
  }
}

class FetchDataCommand extends AbstractCommand {
  constructor(private url: string) {
    super();
  }

  protected onStart(): void {
    fetch(this.url)
      .then(res => res.json())
      .then(data => {
        console.log('Data loaded:', data);
        this.complete();
      });
  }

  protected onStop(): void {
    // Cleanup if command is interrupted
  }
}
```

## CommandableState

States that execute commands when entered:

```typescript
import { StateMachine, CommandableState, WaitForTime } from '@dpid/command-state-machine';

const sm = StateMachine.Create();

const loadingState = CommandableState.Create('loading');
loadingState.AddCommand(LogCommand.Create('Loading started...'));
loadingState.AddCommand(WaitForTime.Create(1000));
loadingState.AddCommand(LogCommand.Create('Loading complete!'));

loadingState.AddTransition('done', 'idle');

sm.AddState(loadingState);
sm.AddState(SimpleState.Create('idle'));

sm.SetState('loading');
// Output:
// Loading started...
// (1 second delay)
// Loading complete!
```

## Parallel Command Execution

Run multiple command sequences simultaneously using layers:

```typescript
const state = CommandableState.Create('parallel-demo');

// Layer 0: Animation sequence
state.AddCommandToLayer(LogCommand.Create('Animation: frame 1'), 0);
state.AddCommandToLayer(WaitForTime.Create(100), 0);
state.AddCommandToLayer(LogCommand.Create('Animation: frame 2'), 0);

// Layer 1: Audio sequence (runs in parallel)
state.AddCommandToLayer(LogCommand.Create('Audio: playing'), 1);
state.AddCommandToLayer(WaitForTime.Create(200), 1);
state.AddCommandToLayer(LogCommand.Create('Audio: done'), 1);

state.EnterState();
// Both layers execute simultaneously
```

## Serial and Parallel Enumerators

For fine-grained control, use enumerators directly:

```typescript
import { SerialCommandEnumerator, ParallelCommandEnumerator } from '@dpid/command-state-machine';

// Serial: commands run one after another
const serial = new SerialCommandEnumerator();
serial.AddCommand(LogCommand.Create('First'));
serial.AddCommand(LogCommand.Create('Second'));
serial.AddCommand(LogCommand.Create('Third'));

// Parallel: all commands start at once
const parallel = new ParallelCommandEnumerator();
parallel.AddCommand(taskA);
parallel.AddCommand(taskB);
parallel.AddCommand(taskC);

// Nest them for complex flows
const workflow = new SerialCommandEnumerator();
workflow.AddCommand(LogCommand.Create('Starting parallel tasks...'));
workflow.AddCommand(parallel);
workflow.AddCommand(LogCommand.Create('All parallel tasks complete!'));

workflow.Start();
```

## Looping

Commands and enumerators support looping:

```typescript
const state = CommandableState.Create('looping');
state.AddCommand(LogCommand.Create('Tick'));
state.AddCommand(WaitForTime.Create(1000));

// Loop layer 0 three times
state.SetLayerLoopCount(0, 3);

// Use -1 for infinite looping
state.SetLayerLoopCount(0, -1);
```

## Automatic State Transitions

Use `CallTransition` to trigger state transitions from within a command sequence:

```typescript
import { StateMachine, CommandableState, CallTransition } from '@dpid/command-state-machine';

const sm = StateMachine.Create();

const intro = CommandableState.Create('intro');
const gameplay = CommandableState.Create('gameplay');

intro.AddTransition('start', gameplay);

// Commands execute, then automatically transition to gameplay
intro.AddCommand(LogCommand.Create('Welcome to the game!'));
intro.AddCommand(WaitForTime.Create(2000));
intro.AddCommand(LogCommand.Create('Starting...'));
intro.AddCommand(CallTransition.Create(intro, 'start'));

sm.AddState(intro);
sm.AddState(gameplay);

sm.SetState('intro');
// After commands complete, automatically transitions to 'gameplay'
```

## API Reference

### State Machine

| Class | Description |
|-------|-------------|
| `StateMachine` | Manages states and transitions |
| `SimpleState` | Basic state without commands |
| `CommandableState` | State that executes commands on enter |
| `AbstractState` | Base class for custom states |

### Commands

| Class | Description |
|-------|-------------|
| `AbstractCommand` | Base class for custom commands |
| `CallTransition` | Triggers a state transition |
| `WaitForTime` | Waits for specified milliseconds |
| `SerialCommandEnumerator` | Runs commands sequentially |
| `ParallelCommandEnumerator` | Runs commands simultaneously |
| `CommandPlayer` | Multi-layer command execution |
| `NullCommand` | No-op command |

### Interfaces

| Interface | Description |
|-----------|-------------|
| `IState` | State contract |
| `IStateMachine` | State machine contract |
| `ICommand` | Command contract |
| `ICommandEnumerator` | Command collection that is itself a command |
| `ICommandPlayer` | Multi-layer command player |

## License

MIT
