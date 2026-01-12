import type { CommandEnumerator } from './command-enumerator.interface';

export interface Command {
  parent: CommandEnumerator | null;
  readonly isCompleted: boolean;

  start(): void;
  stop(): void;
  destroy(): void;
}
