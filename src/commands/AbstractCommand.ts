import type { ICommand } from './ICommand';
import type { ICommandEnumerator } from './ICommandEnumerator';
import { NullCommandEnumerator } from './NullCommandEnumerator';

export abstract class AbstractCommand implements ICommand {
  protected isCompleted: boolean = false;
  protected parent: ICommandEnumerator = NullCommandEnumerator.Create();

  get IsCompleted(): boolean {
    return this.isCompleted;
  }

  get Parent(): ICommandEnumerator | null {
    return this.parent;
  }
  set Parent(value: ICommandEnumerator | null) {
    this.parent = value ?? NullCommandEnumerator.Create();
  }

  Start(): void {
    this.isCompleted = false;
    this.onStart();
  }

  Stop(): void {
    this.onStop();
    this.complete();
  }

  Destroy(): void {
    this.onDestroy();
  }

  protected complete(): void {
    this.isCompleted = true;
    this.parent.HandleCompletedCommand(this);
  }

  protected onStart(): void {}
  protected onStop(): void {}
  protected onDestroy(): void {}
}
