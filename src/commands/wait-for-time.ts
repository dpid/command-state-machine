import type { ICommand } from './i-command';
import { AbstractCommand } from './abstract-command';

export class WaitForTime extends AbstractCommand {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly milliseconds: number) {
    super();
  }

  protected override onStart(): void {
    this.timeoutId = setTimeout(() => {
      this.complete();
    }, this.milliseconds);
  }

  protected override onStop(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  protected override onDestroy(): void {
    this.onStop();
  }

  static create(milliseconds: number): ICommand {
    return new WaitForTime(milliseconds);
  }
}
