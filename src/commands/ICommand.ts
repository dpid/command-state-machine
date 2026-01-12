import type { ICommandEnumerator } from './ICommandEnumerator';

export interface ICommand {
  parent: ICommandEnumerator | null;
  readonly isCompleted: boolean;

  start(): void;
  stop(): void;
  destroy(): void;
}
