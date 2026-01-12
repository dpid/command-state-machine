import type { Command } from './command.interface';
import type { StateTransitionHandler } from '../states/state-transition-handler.interface';
import { AbstractCommand } from './abstract-command';

export class CallTransition extends AbstractCommand {
  private handler: StateTransitionHandler | null = null;
  private transition: string = '';

  protected override onStart(): void {
    if (this.handler !== null && this.transition) {
      this.handler.handleTransition(this.transition);
    }
    this.complete();
  }

  static create(handler: StateTransitionHandler, transition: string): Command {
    const command = new CallTransition();
    command.handler = handler;
    command.transition = transition;
    return command;
  }
}
