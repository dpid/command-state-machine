import type { ICommand } from './i-command';
import type { IStateTransitionHandler } from '../states/i-state-transition-handler';
import { AbstractCommand } from './abstract-command';

export class CallTransition extends AbstractCommand {
  private handler: IStateTransitionHandler | null = null;
  private transition: string = '';

  protected override onStart(): void {
    if (this.handler !== null && this.transition) {
      this.handler.handleTransition(this.transition);
    }
    this.complete();
  }

  static create(handler: IStateTransitionHandler, transition: string): ICommand {
    const command = new CallTransition();
    command.handler = handler;
    command.transition = transition;
    return command;
  }
}
