import type { ICommand } from './ICommand';
import { AbstractCommandEnumerator } from './AbstractCommandEnumerator';
import { NullCommand } from './NullCommand';

export class SerialCommandEnumerator extends AbstractCommandEnumerator {
  protected currentIndex: number = 0;

  protected get CurrentCommand(): ICommand {
    if (this.currentIndex < 0 || this.currentIndex > this.commands.length - 1) {
      return NullCommand.Create();
    }
    return this.commands[this.currentIndex];
  }

  protected override onStart(): void {
    this.currentIndex = 0;
    this.currentLoop = 0;
    this.isCompleted = false;
    this.isActive = true;

    if (this.CommandsCount > 0) {
      this.CurrentCommand.Start();
    }
  }

  protected override onStop(): void {
    this.isActive = false;
    this.commands.forEach((command) => command.Stop());
    this.complete();
  }

  protected override onDestroy(): void {
    this.commands.forEach((command) => command.Destroy());
    this.commands.length = 0;
    this.currentIndex = 0;
    this.currentLoop = 0;
  }

  override HandleCompletedCommand(command: ICommand): void {
    if (this.isActive && !this.isCompleted && command === this.CurrentCommand) {
      this.startNextCommand();
    }
  }

  protected startNextCommand(): void {
    const isCommandsRemaining = this.currentIndex < this.CommandsCount - 1;
    const isLoopsRemaining = this.currentLoop < this.loopCount;
    const isInfiniteLooping = this.loopCount < 0;

    if (isCommandsRemaining) {
      this.currentIndex += 1;
      this.CurrentCommand.Start();
    } else if (isLoopsRemaining || isInfiniteLooping) {
      const nextLoop = this.currentLoop + 1;
      this.onStart();
      this.currentLoop = nextLoop;
    } else {
      this.complete();
    }
  }
}
