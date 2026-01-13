import type { State } from './state.interface';
import type { StateMachine } from './state-machine.interface';

export class NullState implements State {
  private readonly name: string;

  constructor(name?: string) {
    this.name = name ?? 'NullState';
  }

  get stateName(): string {
    return this.name;
  }

  get stateMachine(): StateMachine | null {
    return null;
  }
  set stateMachine(_value: StateMachine | null) {}

  addTransition(_transitionName: string, _toStateOrName: State | string): void {}
  removeTransition(_transitionName: string): void {}
  handleTransition(_transitionName: string): void {}

  enterState(): void {}
  exitState(): void {}
  update(_dt: number): void {}
  destroy(): void {}

  static create(name?: string): State {
    return new NullState(name);
  }
}
