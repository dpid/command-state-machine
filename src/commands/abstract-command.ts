import type { Command, CompletionCallback } from './command.interface';
import type { CommandEnumerator } from './command-enumerator.interface';
import { NullCommandEnumerator } from './null-command-enumerator';

export abstract class AbstractCommand implements Command {
  protected completed: boolean = false;
  protected parentEnumerator: CommandEnumerator = NullCommandEnumerator.create();
  private completionCallbacks: Set<CompletionCallback> = new Set();

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
    this.complete(true);
  }

  destroy(): void {
    this.onDestroy();
    this.completionCallbacks.clear();
  }

  update(dt: number): void {
    if (!this.completed) {
      this.onUpdate(dt);
    }
  }

  /**
   * Register a callback to be invoked when this command completes.
   * Multiple callbacks can be registered and will be called in registration order.
   * Callbacks fire only on normal completion, not when stop() or destroy() is called.
   *
   * @param callback - Function to call when command completes
   * @returns This command instance for method chaining
   *
   * @example
   * WaitForTime.create(1.0)
   *   .onComplete(() => console.log('Timer finished!'))
   *   .onComplete(() => playSound('ding'));
   */
  onComplete(callback: CompletionCallback): this {
    this.completionCallbacks.add(callback);
    return this;
  }

  /**
   * Unregister a previously registered completion callback.
   *
   * @param callback - The callback function to remove
   * @returns This command instance for method chaining
   */
  offComplete(callback: CompletionCallback): this {
    this.completionCallbacks.delete(callback);
    return this;
  }

  protected complete(fromStop: boolean = false): void {
    if (!this.completed) {
      if (!fromStop) {
        this.invokeCompletionCallbacks();
      }
      this.completed = true;
      this.parentEnumerator.handleCompletedCommand(this);
    }
  }

  private invokeCompletionCallbacks(): void {
    const callbacks = Array.from(this.completionCallbacks);
    callbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error('Error in command completion callback:', error);
      }
    });
  }

  protected onStart(): void {}
  protected onStop(): void {}
  protected onDestroy(): void {}
  /**
   * @param _dt Delta time in seconds
   */
  protected onUpdate(_dt: number): void {}
}
