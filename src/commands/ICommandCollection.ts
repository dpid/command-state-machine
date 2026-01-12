import type { ICommand } from './ICommand';

export interface ICommandCollection {
  addCommand(command: ICommand): void;
  removeCommand(command: ICommand): void;
  hasCommand(command: ICommand): boolean;
}
