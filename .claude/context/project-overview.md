# Project Overview

## What It Is

`@dpid/command-state-machine` is a TypeScript library that provides state machine and command pattern implementations for game development. It enables structured game logic through:

- **State Machine**: Manage game states (menus, gameplay, pause, etc.) with clean transitions
- **Command Pattern**: Execute sequences of actions (animations, delays, effects) either serially or in parallel

## Target Users

Game developers building browser-based or JavaScript/TypeScript games who need:
- Organized state management
- Sequenced command execution with timing control
- Game loop integration via `update(dt)` delta time pattern

## High-Level Architecture

```
src/
├── commands/     # Command execution layer
│   ├── Interfaces (Command, CommandEnumerator, CommandPlayer)
│   ├── Abstract bases (AbstractCommand, AbstractCommandEnumerator)
│   ├── Enumerators (SerialCommandEnumerator, ParallelCommandEnumerator)
│   └── Utilities (WaitForTime, CallTransition, NullCommand)
│
├── states/       # State machine layer
│   ├── Interfaces (State, StateMachine)
│   ├── Abstract base (AbstractState)
│   └── Implementations (SimpleState, CommandableState, StateMachine)
│
└── index.ts      # Public exports
```

## Key Concepts

- **States** can be simple (no behavior) or commandable (execute command sequences on enter/exit)
- **Commands** are units of work with lifecycle hooks (start, update, stop, destroy)
- **Enumerators** orchestrate command execution order (serial or parallel)
- **Game loop integration**: All components support `update(dt)` for frame-based updates
