import type { Command } from './command.interface';
import { AbstractCommand } from './abstract-command';

export abstract class AsyncCommand extends AbstractCommand {
  private isExecuting: boolean = false;
  private isStopped: boolean = false;
  private abortController?: AbortController;
  private _error: unknown = null;
  private _hasError: boolean = false;

  get error(): unknown {
    return this._error;
  }

  get isFailed(): boolean {
    return this._hasError;
  }

  protected abstract onExecuteAsync(signal?: AbortSignal): Promise<void>;

  protected override onStart(): void {
    if (this.isExecuting) return;

    this._error = null;
    this._hasError = false;
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
        this._error = error;
        this._hasError = true;
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
