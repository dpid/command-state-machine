import type { Command } from './command.interface';
import { AbstractCommand } from './abstract-command';

export class WaitForTime extends AbstractCommand {
  private elapsed: number = 0;

  constructor(private readonly seconds: number) {
    super();
  }

  protected override onStart(): void {
    this.elapsed = 0;
  }

  protected override onUpdate(dt: number): void {
    this.elapsed += dt;
    if (this.elapsed >= this.seconds) {
      this.complete();
    }
  }

  protected override getDebugCommandName(): string {
    return `WaitForTime (${(this.seconds * 1000).toFixed(0)}ms)`;
  }

  static create(seconds: number): Command {
    return new WaitForTime(seconds);
  }
}
