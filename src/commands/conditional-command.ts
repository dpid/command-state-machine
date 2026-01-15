import type { Command } from './command.interface';
import { AbstractCommand } from './abstract-command';
import { NullCommand } from './null-command';

export class ConditionalCommand extends AbstractCommand {
  private activeBranch: Command | null = null;

  private constructor(
    private readonly predicate: () => boolean,
    private readonly trueBranch: Command,
    private readonly falseBranch: Command
  ) {
    super();
  }

  protected override onStart(): void {
    this.activeBranch = this.predicate() ? this.trueBranch : this.falseBranch;
    this.activeBranch.start();

    if (this.activeBranch.isCompleted) {
      this.complete();
    }
  }

  protected override onUpdate(dt: number): void {
    if (this.activeBranch && !this.activeBranch.isCompleted) {
      this.activeBranch.update(dt);
    }

    if (this.activeBranch && this.activeBranch.isCompleted && !this.completed) {
      this.complete();
    }
  }

  protected override onStop(): void {
    if (this.activeBranch) {
      this.activeBranch.stop();
    }
  }

  protected override onDestroy(): void {
    this.trueBranch.destroy();
    this.falseBranch.destroy();
    this.activeBranch = null;
  }

  static create(
    predicate: () => boolean,
    trueBranch: Command,
    falseBranch: Command | null = null
  ): Command {
    const resolvedFalseBranch = falseBranch ?? NullCommand.create();
    return new ConditionalCommand(predicate, trueBranch, resolvedFalseBranch);
  }
}
