import type { Command } from './command.interface';
import { AbstractCommandEnumerator } from './abstract-command-enumerator';

export class ParallelCommandEnumerator extends AbstractCommandEnumerator {
  protected override onStart(): void {
    this.currentLoopValue = 0;
    this.completed = false;
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

  override handleCompletedCommand(command: Command): void {
    if (!this.completed) {
      const index = this.commands.indexOf(command);
      if (index >= 0) {
        const isAllCommandsCompleted = this.commands.every((cmd) =>
          this.getIsCommandCompleted(cmd)
        );
        if (isAllCommandsCompleted) {
          const isLoopsRemaining = this.currentLoopValue < this.loopCountValue - 1;
          const isInfiniteLooping = this.loopCountValue < 0;
          if (isLoopsRemaining || isInfiniteLooping) {
            const nextLoop = this.currentLoopValue + 1;
            this.onStart();
            this.currentLoopValue = nextLoop;
          } else {
            this.complete();
          }
        }
      }
    }
  }

  protected override getDebugCommandName(): string {
    let name = 'ParallelCommandEnumerator';

    if (this.loopCountValue > 0) {
      name += ` (loop ${this.currentLoopValue + 1}/${this.loopCountValue})`;
    } else if (this.loopCountValue < 0) {
      name += ' (infinite loop)';
    }

    return name;
  }
}
