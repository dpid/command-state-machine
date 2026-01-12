import type { IState } from './IState';
import type { IStateMachine } from './IStateMachine';

export abstract class AbstractState implements IState {
  protected stateName: string = '';
  protected stateMachine: IStateMachine | null = null;
  protected transitionNamesToStateNames: Map<string, string> = new Map();

  get StateName(): string {
    return this.stateName;
  }

  get StateMachine(): IStateMachine | null {
    return this.stateMachine;
  }
  set StateMachine(value: IStateMachine | null) {
    this.stateMachine = value;
  }

  AddTransition(transitionName: string, toStateOrName: IState | string): void {
    if (typeof toStateOrName === 'string') {
      if (!transitionName || !toStateOrName) return;
      this.transitionNamesToStateNames.set(transitionName, toStateOrName);
    } else {
      if (toStateOrName === null) return;
      this.AddTransition(transitionName, toStateOrName.StateName);
    }
  }

  RemoveTransition(transitionName: string): void {
    if (!transitionName) return;
    this.transitionNamesToStateNames.delete(transitionName);
  }

  HandleTransition(transitionName: string): void {
    if (!transitionName?.trim()) return;
    if (this.stateMachine === null) return;

    const toStateName = this.transitionNamesToStateNames.get(transitionName);
    if (toStateName !== undefined) {
      this.stateMachine.SetState(toStateName);
    }
  }

  EnterState(): void {}
  ExitState(): void {}
  Destroy(): void {}
}
