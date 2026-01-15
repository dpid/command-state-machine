import type { CommandEnumerator } from './command-enumerator.interface';

/**
 * Listener invoked when a command completes normally.
 * Does not fire on external stop() or destroy() calls.
 */
export type CompletionListener = () => void;

export interface Command {
  parent: CommandEnumerator | null;
  readonly isCompleted: boolean;

  start(): void;
  stop(): void;
  destroy(): void;
  update(dt: number): void;
  addCompletionListener(listener: CompletionListener): this;
  removeCompletionListener(listener: CompletionListener): this;
}
