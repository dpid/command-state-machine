import type { ICommand } from './ICommand';
import type { ICommandEnumerator } from './ICommandEnumerator';
import { NullCommandEnumerator } from './NullCommandEnumerator';

export class NullCommand implements ICommand {
  private parent: ICommandEnumerator = NullCommandEnumerator.Create();

  get IsCompleted(): boolean {
    return true;
  }

  get Parent(): ICommandEnumerator | null {
    return this.parent;
  }
  set Parent(_value: ICommandEnumerator | null) {}

  Start(): void {}
  Stop(): void {}
  Destroy(): void {}

  static Create(): ICommand {
    return new NullCommand();
  }
}
