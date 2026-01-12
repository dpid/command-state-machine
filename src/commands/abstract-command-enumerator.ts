import type { ICommand } from './i-command';
import type { ICommandEnumerator } from './i-command-enumerator';
import { AbstractCommand } from './abstract-command';

export class AbstractCommandEnumerator extends AbstractCommand implements ICommandEnumerator {
  protected commands: ICommand[] = [];
  protected isActive: boolean = false;
  protected _loopCount: number = 0;
  protected _currentLoop: number = 0;

  protected get commandsCount(): number {
    return this.commands.length;
  }

  get loopCount(): number {
    return this._loopCount;
  }
  set loopCount(value: number) {
    this._loopCount = value;
  }

  get currentLoop(): number {
    return this._currentLoop;
  }

  addCommand(command: ICommand): void {
    this.commands.push(command);
    command.parent = this;
  }

  removeCommand(command: ICommand): void {
    command.stop();
    const index = this.commands.indexOf(command);
    if (index >= 0) {
      this.commands.splice(index, 1);
    }
  }

  hasCommand(command: ICommand): boolean {
    return this.commands.indexOf(command) >= 0;
  }

  handleCompletedCommand(_command: ICommand): void {}

  protected getIsCommandCompleted(command: ICommand): boolean {
    return command.isCompleted;
  }
}
