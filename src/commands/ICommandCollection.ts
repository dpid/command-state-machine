import type { ICommand } from './ICommand';

export interface ICommandCollection {
  AddCommand(command: ICommand): void;
  RemoveCommand(command: ICommand): void;
  HasCommand(command: ICommand): boolean;
}
