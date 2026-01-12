import type { IState } from './IState';
import type { IStateMachine, StateChangeCallback } from './IStateMachine';

export class StateMachine implements IStateMachine {
  private stateChangeCallbacks: Set<StateChangeCallback> = new Set();
  protected stateDictionary: Map<string, IState> = new Map();
  protected currentState: IState | null = null;

  get CurrentState(): IState | null {
    return this.currentState;
  }

  OnStateChange(callback: StateChangeCallback): void {
    this.stateChangeCallbacks.add(callback);
  }

  OffStateChange(callback: StateChangeCallback): void {
    this.stateChangeCallbacks.delete(callback);
  }

  private emitStateChange(stateName: string): void {
    this.stateChangeCallbacks.forEach((callback) => callback(stateName));
  }

  GetState(stateName: string): IState | null {
    return this.stateDictionary.get(stateName) ?? null;
  }

  SetState(stateOrName: IState | string): void {
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
    if (this.currentState !== state) {
      if (this.currentState !== null) {
        this.currentState.ExitState();
      }
      this.currentState = state;
      this.emitStateChange(state.StateName);
    }
    this.currentState.EnterState();
  }

  AddState(state: IState): void {
    state.StateMachine = this;
    this.stateDictionary.set(state.StateName, state);
  }

  RemoveState(state: IState): void {
    state.StateMachine = null;
    this.stateDictionary.delete(state.StateName);
  }

  HandleTransition(transitionName: string): void {
    if (this.currentState !== null) {
      this.currentState.HandleTransition(transitionName);
    }
  }

  Destroy(): void {
    this.stateDictionary.forEach((state) => state.Destroy());
    this.stateDictionary.clear();
    this.stateChangeCallbacks.clear();
  }

  static Create(): StateMachine {
    return new StateMachine();
  }
}
