import type { ICommand } from './ICommand';
import { AbstractCommandEnumerator } from './AbstractCommandEnumerator';

export class ParallelCommandEnumerator extends AbstractCommandEnumerator {
  protected override onStart(): void {
    this.currentLoop = 0;
    this.isCompleted = false;
    this.isActive = true;
    this.commands.forEach((command) => command.Start());
  }

  protected override onStop(): void {
    this.isActive = false;
    this.commands.forEach((command) => command.Stop());
    this.complete();
  }

  protected override onDestroy(): void {
    this.commands.forEach((command) => command.Destroy());
    this.commands.length = 0;
  }

  override HandleCompletedCommand(command: ICommand): void {
    if (!this.isCompleted) {
      const index = this.commands.indexOf(command);
      if (index >= 0) {
        const isAllCommandsCompleted = this.commands.every((cmd) =>
          this.getIsCommandCompleted(cmd)
        );
        if (isAllCommandsCompleted) {
          const isLoopsRemaining = this.currentLoop < this.loopCount - 1;
          const isInfiniteLooping = this.loopCount < 0;
          if (isLoopsRemaining || isInfiniteLooping) {
            const nextLoop = this.currentLoop + 1;
            this.onStart();
            this.currentLoop = nextLoop;
          } else {
            this.complete();
          }
        }
      }
    }
  }
}
