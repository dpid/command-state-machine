import type { Command, CompletionListener } from './command.interface';
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
  private completionListeners: Set<CompletionListener> = new Set();
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
    this.complete(true);
  }

  destroy(): void {
    this.onDestroy();
    this.completionListeners.clear();
  }

  update(dt: number): void {
    if (!this.completed) {
      this.onUpdate(dt);
    }
  }

  /**
   * Register a listener to be invoked when this command completes.
   * Multiple listeners can be registered and will be called in registration order.
   * Listeners fire only on normal completion, not when stop() or destroy() is called.
   *
   * @param listener - Function to call when command completes
   * @returns This command instance for method chaining
   *
   * @example
   * WaitForTime.create(1.0)
   *   .addCompletionListener(() => console.log('Timer finished!'))
   *   .addCompletionListener(() => playSound('ding'));
   */
  addCompletionListener(listener: CompletionListener): this {
    this.completionListeners.add(listener);
    return this;
  }

  /**
   * Unregister a previously registered completion listener.
   *
   * @param listener - The listener function to remove
   * @returns This command instance for method chaining
   */
  removeCompletionListener(listener: CompletionListener): this {
    this.completionListeners.delete(listener);
    return this;
  }

  protected complete(fromStop: boolean = false): void {
    if (!this.completed) {
      if (this.endTime === null) {
        this.endTime = getPerformanceTime();
      }
      if (!fromStop) {
        this.invokeCompletionListeners();
      }
      this.completed = true;
      this.parentEnumerator.handleCompletedCommand(this);
    }
  }

  private invokeCompletionListeners(): void {
    const listeners = Array.from(this.completionListeners);
    listeners.forEach((listener) => {
      try {
        listener();
      } catch (error) {
        console.error('Error in command completion listener:', error);
      }
    });
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
