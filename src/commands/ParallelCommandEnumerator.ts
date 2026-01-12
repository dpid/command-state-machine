import type { ICommand } from './ICommand';
import { AbstractCommandEnumerator } from './AbstractCommandEnumerator';

export class ParallelCommandEnumerator extends AbstractCommandEnumerator {
  protected override onStart(): void {
    this._currentLoop = 0;
    this._isCompleted = false;
    this.isActive = true;
    this.commands.forEach((command) => command.start());
  }

  protected override onStop(): void {
    this.isActive = false;
    this.commands.forEach((command) => command.stop());
    this.complete();
  }

  protected override onDestroy(): void {
    this.commands.forEach((command) => command.destroy());
    this.commands.length = 0;
  }

  override handleCompletedCommand(command: ICommand): void {
    if (!this._isCompleted) {
      const index = this.commands.indexOf(command);
      if (index >= 0) {
        const isAllCommandsCompleted = this.commands.every((cmd) =>
          this.getIsCommandCompleted(cmd)
        );
        if (isAllCommandsCompleted) {
          const isLoopsRemaining = this._currentLoop < this._loopCount - 1;
          const isInfiniteLooping = this._loopCount < 0;
          if (isLoopsRemaining || isInfiniteLooping) {
            const nextLoop = this._currentLoop + 1;
            this.onStart();
            this._currentLoop = nextLoop;
          } else {
            this.complete();
          }
        }
      }
    }
  }
}
