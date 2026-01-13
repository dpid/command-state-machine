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

  static create(): CommandEnumerator {
    return new NullCommandEnumerator();
  }
}
