import type { ICommand } from './i-command';
import type { ICommandEnumerator } from './i-command-enumerator';
import { NullCommandEnumerator } from './null-command-enumerator';

export class NullCommand implements ICommand {
  private _parent: ICommandEnumerator = NullCommandEnumerator.create();

  get isCompleted(): boolean {
    return true;
  }

  get parent(): ICommandEnumerator | null {
    return this._parent;
  }
  set parent(_value: ICommandEnumerator | null) {}

  start(): void {}
  stop(): void {}
  destroy(): void {}

  static create(): ICommand {
    return new NullCommand();
  }
}
