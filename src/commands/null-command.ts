import type { Command } from './command.interface';
import type { CommandEnumerator } from './command-enumerator.interface';
import { NullCommandEnumerator } from './null-command-enumerator';

export class NullCommand implements Command {
  private parentEnumerator: CommandEnumerator = NullCommandEnumerator.create();

  get isCompleted(): boolean {
    return true;
  }

  get parent(): CommandEnumerator | null {
    return this.parentEnumerator;
  }
  set parent(_value: CommandEnumerator | null) {}

  start(): void {}
  stop(): void {}
  destroy(): void {}
  update(_dt: number): void {}

  static create(): Command {
    return new NullCommand();
  }
}
