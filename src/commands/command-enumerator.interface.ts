import type { Command } from './command.interface';
import type { CommandCollection } from './command-collection.interface';

export interface CommandEnumerator extends Command, CommandCollection {
  loopCount: number;
  readonly currentLoop: number;

  handleCompletedCommand(command: Command): void;
}
