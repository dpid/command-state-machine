import type { ICommand } from './ICommand';
import type { ICommandCollection } from './ICommandCollection';

export interface ICommandEnumerator extends ICommand, ICommandCollection {
  loopCount: number;
  readonly currentLoop: number;

  handleCompletedCommand(command: ICommand): void;
}
