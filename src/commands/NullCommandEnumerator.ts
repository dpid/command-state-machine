import type { ICommand } from './ICommand';
import type { ICommandEnumerator } from './ICommandEnumerator';

export class NullCommandEnumerator implements ICommandEnumerator {
  private parent: ICommandEnumerator | null = null;

  get Parent(): ICommandEnumerator | null {
    return this.parent;
  }
  set Parent(_value: ICommandEnumerator | null) {}

  get IsCompleted(): boolean {
    return true;
  }

  Start(): void {}
  Stop(): void {}
  Destroy(): void {}

  get LoopCount(): number {
    return 0;
  }
  set LoopCount(_value: number) {}

  get CurrentLoop(): number {
    return -1;
  }

  HandleCompletedCommand(_command: ICommand): void {}

  AddCommand(_command: ICommand): void {}
  RemoveCommand(_command: ICommand): void {}
  HasCommand(_command: ICommand): boolean {
    return false;
  }

  static Create(): ICommandEnumerator {
    return new NullCommandEnumerator();
  }
}
