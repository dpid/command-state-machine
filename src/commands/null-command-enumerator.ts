import type { Command } from './command.interface';
import type { CommandEnumerator } from './command-enumerator.interface';

export class NullCommandEnumerator implements CommandEnumerator {
  private parentEnumerator: CommandEnumerator | null = null;

  get parent(): CommandEnumerator | null {
    return this.parentEnumerator;
  }
  set parent(_value: CommandEnumerator | null) {}

  get isCompleted(): boolean {
    return true;
  }

  start(): void {}
  stop(): void {}
  destroy(): void {}
  update(_dt: number): void {}

  get loopCount(): number {
    return 0;
  }
  set loopCount(_value: number) {}

  get currentLoop(): number {
    return -1;
  }

  handleCompletedCommand(_command: Command): void {}

  addCommand(_command: Command): void {}
  removeCommand(_command: Command): void {}
  hasCommand(_command: Command): boolean {
    return false;
  }

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
    return `${prefix}NullCommandEnumerator [completed]`;
  }

  static create(): CommandEnumerator {
    return new NullCommandEnumerator();
  }
}
