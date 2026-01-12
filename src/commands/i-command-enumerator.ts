import type { ICommand } from './i-command';
import type { ICommandCollection } from './i-command-collection';

export interface ICommandEnumerator extends ICommand, ICommandCollection {
  loopCount: number;
  readonly currentLoop: number;

  handleCompletedCommand(command: ICommand): void;
}
