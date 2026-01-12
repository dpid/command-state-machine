import type { IStateTransitionHandler } from './IStateTransitionHandler';
import type { IState } from './IState';

export type StateChangeCallback = (stateName: string) => void;

export interface IStateMachine extends IStateTransitionHandler {
  readonly CurrentState: IState | null;

  OnStateChange(callback: StateChangeCallback): void;
  OffStateChange(callback: StateChangeCallback): void;

  GetState(stateName: string): IState | null;
  SetState(stateName: string): void;
  SetState(state: IState): void;

  AddState(state: IState): void;
  RemoveState(state: IState): void;

  Destroy(): void;
}
