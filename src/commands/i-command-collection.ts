import type { ICommand } from './i-command';

export interface ICommandCollection {
  addCommand(command: ICommand): void;
  removeCommand(command: ICommand): void;
  hasCommand(command: ICommand): boolean;
}
