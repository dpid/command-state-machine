import type { Command } from './command.interface';
import { AbstractCommand } from './abstract-command';

/**
 * Abstract base class for commands that execute asynchronous operations.
 *
 * Subclasses implement `onExecuteAsync()` to return a Promise. The command
 * blocks progression until the Promise resolves or rejects.
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
 * @example Cancellable fetch request
 * class CancellableLoadCommand extends AsyncCommand {
 *   constructor(private assetUrl: string) {
 *     super();
 *   }
 *
 *   protected async onExecuteAsync(signal?: AbortSignal): Promise<void> {
 *     try {
 *       const response = await fetch(this.assetUrl, { signal });
 *       this.data = await response.json();
 *     } catch (error) {
 *       if (error instanceof Error && error.name === 'AbortError') {
 *         return;
 *       }
 *       throw error;
 *     }
 *   }
 *
 *   static create(assetUrl: string): Command {
 *     return new CancellableLoadCommand(assetUrl);
 *   }
 * }
 */
export abstract class AsyncCommand extends AbstractCommand {
  private isExecuting: boolean = false;
  private isStopped: boolean = false;
  private abortController?: AbortController;

  /**
   * Subclasses override this to implement their async operation.
   * The Promise should resolve when the operation succeeds, or reject on failure.
   *
   * @param signal - Optional AbortSignal that will be aborted when the command is stopped or destroyed.
   *                 Subclasses can use this to cancel ongoing operations like fetch requests.
   */
  protected abstract onExecuteAsync(signal?: AbortSignal): Promise<void>;

  protected override onStart(): void {
    if (this.isExecuting) return;

    this.isExecuting = true;
    this.isStopped = false;
    this.abortController = new AbortController();

    this.onExecuteAsync(this.abortController.signal)
      .then(() => {
        if (!this.isStopped) {
          this.complete();
        }
      })
      .catch((error) => {
        console.error('AsyncCommand failed:', error ?? 'Unknown error');
        if (!this.isStopped) {
          this.complete();
        }
      })
      .finally(() => {
        this.isExecuting = false;
        this.abortController = undefined;
      });
  }

  protected override onStop(): void {
    this.abortController?.abort();
    this.isStopped = true;
  }

  protected override onDestroy(): void {
    this.abortController?.abort();
    this.isStopped = true;
  }
}
