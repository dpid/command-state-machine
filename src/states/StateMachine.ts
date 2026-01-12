import type { IState } from './IState';
import type { IStateMachine, StateChangeCallback } from './IStateMachine';

export class StateMachine implements IStateMachine {
  private stateChangeCallbacks: Set<StateChangeCallback> = new Set();
  protected stateDictionary: Map<string, IState> = new Map();
  protected _currentState: IState | null = null;

  get currentState(): IState | null {
    return this._currentState;
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

  getState(stateName: string): IState | null {
    return this.stateDictionary.get(stateName) ?? null;
  }

  setState(stateOrName: IState | string): void {
    if (typeof stateOrName === 'string') {
      const state = this.stateDictionary.get(stateOrName);
      if (state !== undefined) {
        this.setCurrentState(state);
      }
    } else {
      const values = Array.from(this.stateDictionary.values());
      if (values.includes(stateOrName)) {
        this.setCurrentState(stateOrName);
      }
    }
  }

  private setCurrentState(state: IState): void {
    if (this._currentState !== state) {
      if (this._currentState !== null) {
        this._currentState.exitState();
      }
      this._currentState = state;
      this.emitStateChange(state.stateName);
    }
    this._currentState.enterState();
  }

  addState(state: IState): void {
    state.stateMachine = this;
    this.stateDictionary.set(state.stateName, state);
  }

  removeState(state: IState): void {
    state.stateMachine = null;
    this.stateDictionary.delete(state.stateName);
  }

  handleTransition(transitionName: string): void {
    if (this._currentState !== null) {
      this._currentState.handleTransition(transitionName);
    }
  }

  destroy(): void {
    this.stateDictionary.forEach((state) => state.destroy());
    this.stateDictionary.clear();
    this.stateChangeCallbacks.clear();
  }

  static create(): StateMachine {
    return new StateMachine();
  }
}
