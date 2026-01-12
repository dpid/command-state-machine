import type { IState } from './i-state';
import type { IStateMachine } from './i-state-machine';

export abstract class AbstractState implements IState {
  protected _stateName: string = '';
  protected _stateMachine: IStateMachine | null = null;
  protected transitionNamesToStateNames: Map<string, string> = new Map();

  get stateName(): string {
    return this._stateName;
  }

  get stateMachine(): IStateMachine | null {
    return this._stateMachine;
  }
  set stateMachine(value: IStateMachine | null) {
    this._stateMachine = value;
  }

  addTransition(transitionName: string, toStateOrName: IState | string): void {
    if (typeof toStateOrName === 'string') {
      if (!transitionName || !toStateOrName) return;
      this.transitionNamesToStateNames.set(transitionName, toStateOrName);
    } else {
      if (toStateOrName === null) return;
      this.addTransition(transitionName, toStateOrName.stateName);
    }
  }

  removeTransition(transitionName: string): void {
    if (!transitionName) return;
    this.transitionNamesToStateNames.delete(transitionName);
  }

  handleTransition(transitionName: string): void {
    if (!transitionName?.trim()) return;
    if (this._stateMachine === null) return;

    const toStateName = this.transitionNamesToStateNames.get(transitionName);
    if (toStateName !== undefined) {
      this._stateMachine.setState(toStateName);
    }
  }

  enterState(): void {}
  exitState(): void {}
  destroy(): void {}
}
