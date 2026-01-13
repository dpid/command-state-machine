import type { Command } from './command.interface';
import { AbstractCommand } from './abstract-command';

/**
 * Abstract base class for commands that execute asynchronous operations.
 *
 * Subclasses implement `onExecuteAsync()` to return a Promise. The command
 * blocks progression until the Promise resolves or rejects.
 *
 * Error handling: After completion, check the `error` property or `isFailed`
 * getter to distinguish success from failure. Errors do not prevent completion.
 *
 * No `update()` calls occur during the async wait period.
 *
 * @example
 * class LoadAssetCommand extends AsyncCommand {
 *   constructor(private assetUrl: string) {
 *     super();
 *   }
 *
 *   protected async onExecuteAsync(): Promise<void> {
 *     const response = await fetch(this.assetUrl);
 *     this.data = await response.json();
 *   }
 *
 *   static create(assetUrl: string): Command {
 *     return new LoadAssetCommand(assetUrl);
 *   }
 * }
 *
 * // Usage with error handling
 * const cmd = LoadAssetCommand.create('data.json');
 * cmd.start();
 * await waitForCompletion(cmd);
 * if (cmd.isFailed) {
 *   console.error('Load failed:', cmd.error);
 * }
 */
export abstract class AsyncCommand extends AbstractCommand {
  private isExecuting: boolean = false;
  private isStopped: boolean = false;
  private _error: unknown = null;
  private _hasError: boolean = false;

  /**
   * The error that caused the async operation to fail, or null if it succeeded.
   * Typed as unknown because Promises can reject with any value.
   */
  get error(): unknown {
    return this._error;
  }

  /**
   * Convenience getter indicating whether the async operation failed.
   * True if the Promise rejected, false if it resolved or hasn't completed yet.
   */
  get isFailed(): boolean {
    return this._hasError;
  }

  /**
   * Subclasses override this to implement their async operation.
   * The Promise should resolve when the operation succeeds, or reject on failure.
   */
  protected abstract onExecuteAsync(): Promise<void>;

  protected override onStart(): void {
    if (this.isExecuting) return;

    this._error = null;
    this._hasError = false;
    this.isExecuting = true;
    this.isStopped = false;

    this.onExecuteAsync()
      .then(() => {
        if (!this.isStopped) {
          this.complete();
        }
      })
      .catch((error) => {
        this._error = error;
        this._hasError = true;
        if (!this.isStopped) {
          this.complete();
        }
      })
      .finally(() => {
        this.isExecuting = false;
      });
  }

  protected override onStop(): void {
    this.isStopped = true;
  }

  protected override onDestroy(): void {
    this.isStopped = true;
  }
}
