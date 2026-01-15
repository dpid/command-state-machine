import type { CommandEnumerator } from './command-enumerator.interface';

/**
 * Callback invoked when a command completes normally.
 * Does not fire on external stop() or destroy() calls.
 */
export type CompletionCallback = () => void;

export interface Command {
  parent: CommandEnumerator | null;
  readonly isCompleted: boolean;

  start(): void;
  stop(): void;
  destroy(): void;
  update(dt: number): void;
  onComplete(callback: CompletionCallback): this;
  offComplete(callback: CompletionCallback): this;
}
