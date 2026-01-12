import type { ICommandEnumerator } from './i-command-enumerator';

export interface ICommand {
  parent: ICommandEnumerator | null;
  readonly isCompleted: boolean;

  start(): void;
  stop(): void;
  destroy(): void;
}
