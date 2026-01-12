import type { ICommand } from './ICommand';
import type { IStateTransitionHandler } from '../states/IStateTransitionHandler';
import { AbstractCommand } from './AbstractCommand';

export class CallTransition extends AbstractCommand {
  private handler: IStateTransitionHandler | null = null;
  private transition: string = '';

  protected override onStart(): void {
    if (this.handler !== null && this.transition) {
      this.handler.HandleTransition(this.transition);
    }
    this.complete();
  }

  static Create(handler: IStateTransitionHandler, transition: string): ICommand {
    const command = new CallTransition();
    command.handler = handler;
    command.transition = transition;
    return command;
  }
}
