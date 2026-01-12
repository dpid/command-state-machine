import type { IStateTransitionHandler } from './IStateTransitionHandler';
import type { IStateMachine } from './IStateMachine';

export interface IState extends IStateTransitionHandler {
  readonly StateName: string;

  StateMachine: IStateMachine | null;

  AddTransition(transitionName: string, toState: IState): void;
  AddTransition(transitionName: string, toStateName: string): void;
  RemoveTransition(transitionName: string): void;

  EnterState(): void;
  ExitState(): void;

  Destroy(): void;
}
