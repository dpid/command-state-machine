import type { Command } from './command.interface';
import type { CommandEnumerator } from './command-enumerator.interface';
import { NullCommandEnumerator } from './null-command-enumerator';

function getPerformanceTime(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

export abstract class AbstractCommand implements Command {
  protected completed: boolean = false;
  protected parentEnumerator: CommandEnumerator = NullCommandEnumerator.create();
  private startTime: number | null = null;
  private endTime: number | null = null;

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
    this.startTime = getPerformanceTime();
    this.onStart();
  }

  stop(): void {
    this.endTime = getPerformanceTime();
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
    if (this.endTime === null) {
      this.endTime = getPerformanceTime();
    }
    this.completed = true;
    this.parentEnumerator.handleCompletedCommand(this);
  }

  getElapsedTime(): number | null {
    if (this.startTime === null) {
      return null;
    }
    if (this.endTime !== null) {
      return this.endTime - this.startTime;
    }
    return getPerformanceTime() - this.startTime;
  }

  debugDumpTree(indent: string, depth: number): string {
    const prefix = ' '.repeat(depth * 2);
    const commandName = this.getDebugCommandName();
    const status = this.getDebugStatus();
    const elapsedInfo = this.formatElapsedTime();
    return `${prefix}${commandName} [${status}]${elapsedInfo}`;
  }

  protected getDebugStatus(): string {
    if (this.startTime === null) {
      return 'pending';
    }
    if (this.completed) {
      return 'completed';
    }
    return 'running';
  }

  protected getDebugCommandName(): string {
    return this.constructor.name;
  }

  protected formatElapsedTime(): string {
    const elapsed = this.getElapsedTime();
    if (elapsed === null) {
      return '';
    }
    return ` (${elapsed.toFixed(2)}ms elapsed)`;
  }

  protected onStart(): void {}
  protected onStop(): void {}
  protected onDestroy(): void {}
  /**
   * @param _dt Delta time in seconds
   */
  protected onUpdate(_dt: number): void {}
}
