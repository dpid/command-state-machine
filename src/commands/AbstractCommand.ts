import type { ICommand } from './ICommand';
import type { ICommandEnumerator } from './ICommandEnumerator';
import { NullCommandEnumerator } from './NullCommandEnumerator';

export abstract class AbstractCommand implements ICommand {
  protected _isCompleted: boolean = false;
  protected _parent: ICommandEnumerator = NullCommandEnumerator.create();

  get isCompleted(): boolean {
    return this._isCompleted;
  }

  get parent(): ICommandEnumerator | null {
    return this._parent;
  }
  set parent(value: ICommandEnumerator | null) {
    this._parent = value ?? NullCommandEnumerator.create();
  }

  start(): void {
    this._isCompleted = false;
    this.onStart();
  }

  stop(): void {
    this.onStop();
    this.complete();
  }

  destroy(): void {
    this.onDestroy();
  }

  protected complete(): void {
    this._isCompleted = true;
    this._parent.handleCompletedCommand(this);
  }

  protected onStart(): void {}
  protected onStop(): void {}
  protected onDestroy(): void {}
}
