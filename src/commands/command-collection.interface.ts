import type { Command } from './command.interface';

export interface CommandCollection {
  addCommand(command: Command): void;
  removeCommand(command: Command): void;
  hasCommand(command: Command): boolean;
}
