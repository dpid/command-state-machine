import type { Command } from './command.interface';
import { AbstractCommandEnumerator } from './abstract-command-enumerator';
import { NullCommand } from './null-command';

export class SerialCommandEnumerator extends AbstractCommandEnumerator {
  protected currentIndex: number = 0;

  protected get currentCommand(): Command {
    if (this.currentIndex < 0 || this.currentIndex > this.commands.length - 1) {
      return NullCommand.create();
    }
    return this.commands[this.currentIndex];
  }

  protected override onStart(): void {
    this.currentIndex = 0;
    this.currentLoopValue = 0;
    this.completed = false;
    this.isActive = true;

    if (this.commandsCount > 0) {
      this.currentCommand.start();
    }
  }

  protected override onStop(): void {
    this.isActive = false;
    this.commands.forEach((command) => command.stop());
    this.complete();
  }

  protected override onDestroy(): void {
    this.commands.forEach((command) => command.destroy());
    this.commands.length = 0;
    this.currentIndex = 0;
    this.currentLoopValue = 0;
  }

  override handleCompletedCommand(command: Command): void {
    if (this.isActive && !this.completed && command === this.currentCommand) {
      this.startNextCommand();
    }
  }

  protected startNextCommand(): void {
    const isCommandsRemaining = this.currentIndex < this.commandsCount - 1;
    const isLoopsRemaining = this.currentLoopValue < this.loopCountValue;
    const isInfiniteLooping = this.loopCountValue < 0;

    if (isCommandsRemaining) {
      this.currentIndex += 1;
      this.currentCommand.start();
    } else if (isLoopsRemaining || isInfiniteLooping) {
      const nextLoop = this.currentLoopValue + 1;
      this.onStart();
      this.currentLoopValue = nextLoop;
    } else {
      this.complete();
    }
  }

  protected override onUpdate(dt: number): void {
    if (!this.currentCommand.isCompleted) {
      this.currentCommand.update(dt);
    }
  }

  protected override getDebugCommandName(): string {
    const currentIndex = this.currentIndex;
    const commandsCount = this.commandsCount;
    let name = `SerialCommandEnumerator (cmd ${currentIndex + 1}/${commandsCount})`;

    if (this.loopCountValue > 0) {
      name += `, loop ${this.currentLoopValue + 1}/${this.loopCountValue}`;
    } else if (this.loopCountValue < 0) {
      name += ', infinite loop';
    }

    return name;
  }
}
