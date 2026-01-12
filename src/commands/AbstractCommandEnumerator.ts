import type { ICommand } from './ICommand';
import type { ICommandEnumerator } from './ICommandEnumerator';
import { AbstractCommand } from './AbstractCommand';

export class AbstractCommandEnumerator extends AbstractCommand implements ICommandEnumerator {
  protected commands: ICommand[] = [];
  protected isActive: boolean = false;
  protected loopCount: number = 0;
  protected currentLoop: number = 0;

  protected get CommandsCount(): number {
    return this.commands.length;
  }

  get LoopCount(): number {
    return this.loopCount;
  }
  set LoopCount(value: number) {
    this.loopCount = value;
  }

  get CurrentLoop(): number {
    return this.currentLoop;
  }

  AddCommand(command: ICommand): void {
    this.commands.push(command);
    command.Parent = this;
  }

  RemoveCommand(command: ICommand): void {
    command.Stop();
    const index = this.commands.indexOf(command);
    if (index >= 0) {
      this.commands.splice(index, 1);
    }
  }

  HasCommand(command: ICommand): boolean {
    return this.commands.indexOf(command) >= 0;
  }

  HandleCompletedCommand(_command: ICommand): void {}

  protected getIsCommandCompleted(command: ICommand): boolean {
    return command.IsCompleted;
  }
}
