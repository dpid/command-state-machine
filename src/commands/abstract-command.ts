import type { Command, CompletionListener } from './command.interface';
import type { CommandEnumerator } from './command-enumerator.interface';
import { NullCommandEnumerator } from './null-command-enumerator';

export abstract class AbstractCommand implements Command {
  protected completed: boolean = false;
  protected parentEnumerator: CommandEnumerator = NullCommandEnumerator.create();
  private completionListeners: Set<CompletionListener> = new Set();

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

  protected onStart(): void {}
  protected onStop(): void {}
  protected onDestroy(): void {}
  /**
   * @param _dt Delta time in seconds
   */
  protected onUpdate(_dt: number): void {}
}
