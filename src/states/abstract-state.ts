import type { State } from './state.interface';
import type { StateMachine } from './state-machine.interface';

export abstract class AbstractState implements State {
  protected name: string = '';
  protected machine: StateMachine | null = null;
  protected transitionNamesToStateNames: Map<string, string> = new Map();

  get stateName(): string {
    return this.name;
  }

  get stateMachine(): StateMachine | null {
    return this.machine;
  }
  set stateMachine(value: StateMachine | null) {
    this.machine = value;
  }

  addTransition(transitionName: string, toStateOrName: State | string): void {
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
    if (this.machine === null) return;

    const toStateName = this.transitionNamesToStateNames.get(transitionName);
    if (toStateName !== undefined) {
      this.machine.setState(toStateName);
    }
  }

  enterState(): void {}
  exitState(): void {}
  destroy(): void {}
}
