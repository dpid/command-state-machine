import type { IStateTransitionHandler } from './i-state-transition-handler';
import type { IStateMachine } from './i-state-machine';

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
