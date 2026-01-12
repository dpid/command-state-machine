import type { ICommandEnumerator } from './ICommandEnumerator';

export interface ICommand {
  Parent: ICommandEnumerator | null;
  readonly IsCompleted: boolean;

  Start(): void;
  Stop(): void;
  Destroy(): void;
}
