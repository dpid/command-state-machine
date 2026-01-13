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
 */
export abstract class AsyncCommand extends AbstractCommand {
  private isExecuting: boolean = false;
  private isStopped: boolean = false;

  /**
   * Subclasses override this to implement their async operation.
   * The Promise should resolve when the operation succeeds, or reject on failure.
   */
  protected abstract onExecuteAsync(): Promise<void>;

  protected override onStart(): void {
    if (this.isExecuting) return;

    this.isExecuting = true;
    this.isStopped = false;

    this.onExecuteAsync()
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
      });
  }

  protected override onStop(): void {
    this.isStopped = true;
  }

  protected override onDestroy(): void {
    this.isStopped = true;
  }
}
