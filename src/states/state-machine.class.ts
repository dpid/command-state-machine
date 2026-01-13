import type { State } from './state.interface';
import type { StateMachine, StateChangeCallback } from './state-machine.interface';

export class StateMachineImpl implements StateMachine {
  private stateChangeCallbacks: Set<StateChangeCallback> = new Set();
  protected stateDictionary: Map<string, State> = new Map();
  protected activeState: State | null = null;

  get currentState(): State | null {
    return this.activeState;
  }

  onStateChange(callback: StateChangeCallback): void {
    this.stateChangeCallbacks.add(callback);
  }

  offStateChange(callback: StateChangeCallback): void {
    this.stateChangeCallbacks.delete(callback);
  }

  private emitStateChange(stateName: string): void {
    this.stateChangeCallbacks.forEach((callback) => callback(stateName));
  }

  getState(stateName: string): State | null {
    return this.stateDictionary.get(stateName) ?? null;
  }

  setState(stateOrName: State | string): void {
    if (typeof stateOrName === 'string') {
      const state = this.stateDictionary.get(stateOrName);
      if (state !== undefined) {
        this.setCurrentState(state);
      }
    } else {
      this.setCurrentState(stateOrName);
    }
  }

  private setCurrentState(state: State): void {
    if (this.activeState !== state) {
      if (this.activeState !== null) {
        this.activeState.exitState();
      }
      this.activeState = state;
      this.emitStateChange(state.stateName);
      this.activeState.enterState();
    }
  }

  addState(state: State): void {
    state.stateMachine = this;
    this.stateDictionary.set(state.stateName, state);
  }

  removeState(state: State): void {
    state.stateMachine = null;
    this.stateDictionary.delete(state.stateName);
  }

  handleTransition(transitionName: string): void {
    if (this.activeState !== null) {
      this.activeState.handleTransition(transitionName);
    }
  }

  update(dt: number): void {
    if (this.activeState !== null) {
      this.activeState.update(dt);
    }
  }

  destroy(): void {
    this.stateDictionary.forEach((state) => state.destroy());
    this.stateDictionary.clear();
    this.stateChangeCallbacks.clear();
  }

  static create(): StateMachineImpl {
    return new StateMachineImpl();
  }
}

export { StateMachineImpl as StateMachine };
