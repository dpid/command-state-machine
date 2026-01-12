import type { IStateTransitionHandler } from './IStateTransitionHandler';
import type { IStateMachine } from './IStateMachine';

export interface IState extends IStateTransitionHandler {
  readonly stateName: string;

  stateMachine: IStateMachine | null;

  addTransition(transitionName: string, toState: IState): void;
  addTransition(transitionName: string, toStateName: string): void;
  removeTransition(transitionName: string): void;

  enterState(): void;
  exitState(): void;

  destroy(): void;
}
