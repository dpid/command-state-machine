import type { StateTransitionHandler } from './state-transition-handler.interface';
import type { State } from './state.interface';

export type StateChangeListener = (stateName: string) => void;

export interface StateMachine extends StateTransitionHandler {
  readonly currentState: State | null;

  addStateChangeListener(listener: StateChangeListener): void;
  removeStateChangeListener(listener: StateChangeListener): void;

  /**
   * Enable or disable debug logging of state transitions
   */
  setDebugMode(enabled: boolean): void;

  getState(stateName: string): State | null;
  setState(stateName: string): void;
  setState(state: State): void;

  addState(state: State): void;
  removeState(state: State): void;

  /**
   * @param dt Delta time in seconds
   */
  update(dt: number): void;
  destroy(): void;
}
