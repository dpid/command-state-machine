import type { ICommand } from './ICommand';
import { AbstractCommand } from './AbstractCommand';

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

  static Create(milliseconds: number): ICommand {
    return new WaitForTime(milliseconds);
  }
}
