import type { Command } from './command.interface';
import type { CommandEnumerator } from './command-enumerator.interface';
import { NullCommandEnumerator } from './null-command-enumerator';

export abstract class AbstractCommand implements Command {
  protected completed: boolean = false;
  protected parentEnumerator: CommandEnumerator = NullCommandEnumerator.create();

  get isCompleted(): boolean {
    return this.completed;
  }

  get parent(): CommandEnumerator | null {
    return this.parentEnumerator;
  }
  set parent(value: CommandEnumerator | null) {
    this.parentEnumerator = value ?? NullCommandEnumerator.create();
  }

  start(): void {
    this.completed = false;
    this.onStart();
  }

  stop(): void {
    this.onStop();
    this.complete();
  }

  destroy(): void {
    this.onDestroy();
  }

  update(dt: number): void {
    if (!this.completed) {
      this.onUpdate(dt);
    }
  }

  protected complete(): void {
    this.completed = true;
    this.parentEnumerator.handleCompletedCommand(this);
  }

  protected onStart(): void {}
  protected onStop(): void {}
  protected onDestroy(): void {}
  protected onUpdate(_dt: number): void {}
}
