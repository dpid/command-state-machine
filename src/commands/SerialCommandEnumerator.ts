import type { ICommand } from './ICommand';
import { AbstractCommandEnumerator } from './AbstractCommandEnumerator';
import { NullCommand } from './NullCommand';

export class SerialCommandEnumerator extends AbstractCommandEnumerator {
  protected currentIndex: number = 0;

  protected get currentCommand(): ICommand {
    if (this.currentIndex < 0 || this.currentIndex > this.commands.length - 1) {
      return NullCommand.create();
    }
    return this.commands[this.currentIndex];
  }

  protected override onStart(): void {
    this.currentIndex = 0;
    this._currentLoop = 0;
    this._isCompleted = false;
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
    this._currentLoop = 0;
  }

  override handleCompletedCommand(command: ICommand): void {
    if (this.isActive && !this._isCompleted && command === this.currentCommand) {
      this.startNextCommand();
    }
  }

  protected startNextCommand(): void {
    const isCommandsRemaining = this.currentIndex < this.commandsCount - 1;
    const isLoopsRemaining = this._currentLoop < this._loopCount;
    const isInfiniteLooping = this._loopCount < 0;

    if (isCommandsRemaining) {
      this.currentIndex += 1;
      this.currentCommand.start();
    } else if (isLoopsRemaining || isInfiniteLooping) {
      const nextLoop = this._currentLoop + 1;
      this.onStart();
      this._currentLoop = nextLoop;
    } else {
      this.complete();
    }
  }
}
