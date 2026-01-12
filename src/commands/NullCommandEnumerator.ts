import type { ICommand } from './ICommand';
import type { ICommandEnumerator } from './ICommandEnumerator';

export class NullCommandEnumerator implements ICommandEnumerator {
  private _parent: ICommandEnumerator | null = null;

  get parent(): ICommandEnumerator | null {
    return this._parent;
  }
  set parent(_value: ICommandEnumerator | null) {}

  get isCompleted(): boolean {
    return true;
  }

  start(): void {}
  stop(): void {}
  destroy(): void {}

  get loopCount(): number {
    return 0;
  }
  set loopCount(_value: number) {}

  get currentLoop(): number {
    return -1;
  }

  handleCompletedCommand(_command: ICommand): void {}

  addCommand(_command: ICommand): void {}
  removeCommand(_command: ICommand): void {}
  hasCommand(_command: ICommand): boolean {
    return false;
  }

  static create(): ICommandEnumerator {
    return new NullCommandEnumerator();
  }
}
