import type { StateTransitionHandler } from './state-transition-handler.interface';
import type { State } from './state.interface';

export type StateChangeCallback = (stateName: string) => void;

export interface StateMachine extends StateTransitionHandler {
  readonly currentState: State | null;

  onStateChange(callback: StateChangeCallback): void;
  offStateChange(callback: StateChangeCallback): void;

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
