import type { Command } from './command.interface';
import { AbstractCommand } from './abstract-command';

export class WaitForTime extends AbstractCommand {
  private elapsed: number = 0;

  constructor(private readonly milliseconds: number) {
    super();
  }

  protected override onStart(): void {
    this.elapsed = 0;
  }

  protected override onUpdate(dt: number): void {
    this.elapsed += dt;
    if (this.elapsed >= this.milliseconds) {
      this.complete();
    }
  }

  static create(milliseconds: number): Command {
    return new WaitForTime(milliseconds);
  }
}
