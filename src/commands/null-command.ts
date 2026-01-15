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

  addCompletionListener(_listener: () => void): this {
    return this;
  }

  removeCompletionListener(_listener: () => void): this {
    return this;
  }

  getElapsedTime(): number | null {
    return null;
  }

  protected debugDumpTree(_indent: string, depth: number): string {
    const prefix = ' '.repeat(depth * 2);
    return `${prefix}NullCommand [completed]`;
  }

  static create(): Command {
    return new NullCommand();
  }
}
