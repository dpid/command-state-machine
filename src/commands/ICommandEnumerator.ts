import type { ICommand } from './ICommand';
import type { ICommandCollection } from './ICommandCollection';

export interface ICommandEnumerator extends ICommand, ICommandCollection {
  LoopCount: number;
  readonly CurrentLoop: number;

  HandleCompletedCommand(command: ICommand): void;
}
