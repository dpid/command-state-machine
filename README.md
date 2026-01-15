# @dpid/command-state-machine

A command-driven state machine for TypeScript. Features hierarchical states with transition inheritance, plus serial, parallel, and layered command execution.

## Installation

```bash
npm install @dpid/command-state-machine
```

## Quick Start

```typescript
import { StateMachine, SimpleState, CommandableState, WaitForTime, AbstractCommand } from '@dpid/command-state-machine';

// Create a state machine
const sm = StateMachine.create();

// Add states
const idle = SimpleState.create('idle');
const running = SimpleState.create('running');

// Define transitions
idle.addTransition('start', running);
running.addTransition('stop', idle);

sm.addState(idle);
sm.addState(running);

// Listen for state changes
sm.addStateChangeListener((stateName) => {
  console.log(`State: ${stateName}`);
});

// Set initial state and trigger transitions
sm.setState('idle');
sm.handleTransition('start'); // -> running
sm.handleTransition('stop');  // -> idle
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

  static create(message: string): ICommand {
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

const sm = StateMachine.create();

const loadingState = CommandableState.create('loading');
loadingState.addCommand(LogCommand.create('Loading started...'));
loadingState.addCommand(WaitForTime.create(1.0));
loadingState.addCommand(LogCommand.create('Loading complete!'));

loadingState.addTransition('done', 'idle');

sm.addState(loadingState);
sm.addState(SimpleState.create('idle'));

sm.setState('loading');
// Output:
// Loading started...
// (1 second delay)
// Loading complete!
```

## Parallel Command Execution

Run multiple command sequences simultaneously using layers:

```typescript
const state = CommandableState.create('parallel-demo');

// Layer 0: Animation sequence
state.addCommandToLayer(LogCommand.create('Animation: frame 1'), 0);
state.addCommandToLayer(WaitForTime.create(0.1), 0);
state.addCommandToLayer(LogCommand.create('Animation: frame 2'), 0);

// Layer 1: Audio sequence (runs in parallel)
state.addCommandToLayer(LogCommand.create('Audio: playing'), 1);
state.addCommandToLayer(WaitForTime.create(0.2), 1);
state.addCommandToLayer(LogCommand.create('Audio: done'), 1);

state.enterState();
// Both layers execute simultaneously
```

## Serial and Parallel Enumerators

For fine-grained control, use enumerators directly:

```typescript
import { SerialCommandEnumerator, ParallelCommandEnumerator } from '@dpid/command-state-machine';

// Serial: commands run one after another
const serial = new SerialCommandEnumerator();
serial.addCommand(LogCommand.create('First'));
serial.addCommand(LogCommand.create('Second'));
serial.addCommand(LogCommand.create('Third'));

// Parallel: all commands start at once
const parallel = new ParallelCommandEnumerator();
parallel.addCommand(taskA);
parallel.addCommand(taskB);
parallel.addCommand(taskC);

// Nest them for complex flows
const workflow = new SerialCommandEnumerator();
workflow.addCommand(LogCommand.create('Starting parallel tasks...'));
workflow.addCommand(parallel);
workflow.addCommand(LogCommand.create('All parallel tasks complete!'));

workflow.start();
```

## Looping

Commands and enumerators support looping:

```typescript
const state = CommandableState.create('looping');
state.addCommand(LogCommand.create('Tick'));
state.addCommand(WaitForTime.create(1.0));

// Loop layer 0 three times
state.setLayerLoopCount(0, 3);

// Use -1 for infinite looping
state.setLayerLoopCount(0, -1);
```

## Automatic State Transitions

Use `CallTransition` to trigger state transitions from within a command sequence:

```typescript
import { StateMachine, CommandableState, CallTransition } from '@dpid/command-state-machine';

const sm = StateMachine.create();

const intro = CommandableState.create('intro');
const gameplay = CommandableState.create('gameplay');

intro.addTransition('start', gameplay);

// Commands execute, then automatically transition to gameplay
intro.addCommand(LogCommand.create('Welcome to the game!'));
intro.addCommand(WaitForTime.create(2.0));
intro.addCommand(LogCommand.create('Starting...'));
intro.addCommand(CallTransition.create(intro, 'start'));

sm.addState(intro);
sm.addState(gameplay);

sm.setState('intro');
// After commands complete, automatically transitions to 'gameplay'
```

## Hierarchical State Machines

States can contain substates, forming a tree structure. This enables transition inheritance, local transitions, and history support.

### Creating a Hierarchy

```typescript
import { StateMachine, AbstractState, CommandableState } from '@dpid/command-state-machine';

const sm = StateMachine.create();

// Create parent and child states
const playing = AbstractState.create('Playing');
const combat = AbstractState.create('Combat');
const attacking = AbstractState.create('Attacking');
const defending = AbstractState.create('Defending');

// Build the hierarchy
playing.addSubstate(combat);
combat.addSubstate(attacking);
combat.addSubstate(defending);

// Define transitions
combat.addTransition('attack', attacking);
combat.addTransition('defend', defending);
attacking.addTransition('switchToDefend', defending);

sm.addState(playing);

// Enter nested state using dot notation
sm.setState('Playing.Combat.Attacking');
// Calls enterState() on: Playing → Combat → Attacking
```

### Transition Inheritance

Transitions defined on a parent apply to all descendants:

```typescript
// Define once on parent
playing.addTransition('pause', 'Paused');
playing.addTransition('gameOver', 'GameOver');

sm.addState(SimpleState.create('Paused'));
sm.addState(SimpleState.create('GameOver'));

sm.setState('Playing.Combat.Attacking');

// Works from any substate - inherited from Playing
sm.handleTransition('pause'); // → Paused
```

### Local Transitions

Sibling-to-sibling transitions don't exit the parent state:

```typescript
const combat = CommandableState.create('Combat');
combat.addCommand(PlayMusicCommand.create('battle.mp3')); // Starts on enter

const attacking = AbstractState.create('Attacking');
const defending = AbstractState.create('Defending');
attacking.addTransition('block', defending);

combat.addSubstate(attacking);
combat.addSubstate(defending);

sm.setState('Playing.Combat.Attacking');
sm.handleTransition('block'); // → Defending
// Combat music keeps playing - Combat was never exited
```

### History States

States remember their last active child. Use `enterWithHistory()` to resume:

```typescript
sm.setState('Playing.Combat.Attacking');
sm.setState('Paused'); // Exit hierarchy

// Later, resume where we left off
const playing = sm.getState('Playing');
playing.enterWithHistory();
// Re-enters: Playing → Combat → Attacking
```

### Hierarchy API

```typescript
// Add/remove substates
parentState.addSubstate(childState);
parentState.removeSubstate(childState);

// Access hierarchy
state.parent;              // Parent state or null
state.children;            // Array of child states
state.getStatePath();      // 'Playing.Combat.Attacking'
state.lastActiveChild;     // Last entered child or null

// Enter states
state.enterPath('Combat.Attacking');  // Enter nested path
state.enterWithHistory();              // Resume last active path

// Transitions within hierarchy
state.transitionTo(otherState);  // Finds common ancestor, exits/enters efficiently
```

## Debugging

### Command Tree Visualization

Use `debugDump()` on a CommandPlayer to see the full command hierarchy with status and timing:

```typescript
const state = CommandableState.create('combat');
state.addCommand(WaitForTime.create(0.5));
state.addCommand(LogCommand.create('Attack!'));

state.enterState();
// ... after some time ...

console.log(state.commandPlayer.debugDump());
```

Output:
```
CommandPlayer [running] (234.56ms elapsed)
  SerialCommandEnumerator (cmd 1/2), loop 1/1 [running]
    WaitForTime (500ms) [running] (234.56ms elapsed)
    LogCommand [pending]
```

Status indicators: `[pending]`, `[running]`, `[completed]`

### State Machine Debug Mode

Enable console logging of state transitions:

```typescript
const sm = StateMachine.create();
sm.setDebugMode(true);

sm.setState('idle');
// Console: [StateMachine] idle @ 1234567890

sm.handleTransition('start');
// Console: [StateMachine] running @ 1234567891
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
| `WaitForTime` | Waits for specified seconds |
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
