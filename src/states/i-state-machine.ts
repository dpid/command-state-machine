import type { IStateTransitionHandler } from './i-state-transition-handler';
import type { IState } from './i-state';

export type StateChangeCallback = (stateName: string) => void;

export interface IStateMachine extends IStateTransitionHandler {
  readonly currentState: IState | null;

  onStateChange(callback: StateChangeCallback): void;
  offStateChange(callback: StateChangeCallback): void;

  getState(stateName: string): IState | null;
  setState(stateName: string): void;
  setState(state: IState): void;

  addState(state: IState): void;
  removeState(state: IState): void;

  destroy(): void;
}
