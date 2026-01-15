import type { Command } from './command.interface';
import { AbstractCommand } from './abstract-command';
import { NullCommand } from './null-command';

/**
 * Command that executes one of two branches based on a runtime condition.
 *
 * The predicate is evaluated when start() is called, not at construction time.
 * Only the chosen branch executes; the other branch is never started.
 *
 * @example Basic usage
 * const condition = ConditionalCommand.create(
 *   () => enemy.isDead,
 *   WaitForTime.create(1.0),  // Play victory animation
 *   NullCommand.create()      // Continue immediately
 * );
 *
 * @example Optional false branch (no-op)
 * const condition = ConditionalCommand.create(
 *   () => player.hasShield,
 *   PlayShieldEffect.create()
 *   // No false branch needed
 * );
 *
 * @example Nested conditionals
 * const condition = ConditionalCommand.create(
 *   () => enemy.health <= 0,
 *   ConditionalCommand.create(
 *     () => enemy.isBoss,
 *     PlayBossDefeatSequence.create(),
 *     PlayEnemyDefeatSequence.create()
 *   ),
 *   AttackCommand.create()
 * );
 *
 * @example In a serial sequence
 * const sequence = new SerialCommandEnumerator();
 * sequence.addCommand(MoveToEnemy.create());
 * sequence.addCommand(
 *   ConditionalCommand.create(
 *     () => enemy.isDead,
 *     WaitForTime.create(1.0),
 *     AttackCommand.create()
 *   )
 * );
 * sequence.addCommand(ReturnToIdle.create());
 */
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
