import type { Command } from './command.interface';
import type { CommandEnumerator } from './command-enumerator.interface';
import { AbstractCommand } from './abstract-command';

export class AbstractCommandEnumerator extends AbstractCommand implements CommandEnumerator {
  protected commands: Command[] = [];
  protected isActive: boolean = false;
  protected loopCountValue: number = 0;
  protected currentLoopValue: number = 0;

  protected get commandsCount(): number {
    return this.commands.length;
  }

  get loopCount(): number {
    return this.loopCountValue;
  }
  set loopCount(value: number) {
    this.loopCountValue = value;
  }

  get currentLoop(): number {
    return this.currentLoopValue;
  }

  addCommand(command: Command): void {
    this.commands.push(command);
    command.parent = this;
  }

  removeCommand(command: Command): void {
    command.stop();
    const index = this.commands.indexOf(command);
    if (index >= 0) {
      this.commands.splice(index, 1);
    }
  }

  hasCommand(command: Command): boolean {
    return this.commands.indexOf(command) >= 0;
  }

  handleCompletedCommand(_command: Command): void {}

  protected getIsCommandCompleted(command: Command): boolean {
    return command.isCompleted;
  }
}
