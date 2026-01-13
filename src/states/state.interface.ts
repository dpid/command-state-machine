import type { StateTransitionHandler } from './state-transition-handler.interface';
import type { StateMachine } from './state-machine.interface';

export interface State extends StateTransitionHandler {
  readonly stateName: string;

  stateMachine: StateMachine | null;

  addTransition(transitionName: string, toState: State): void;
  addTransition(transitionName: string, toStateName: string): void;
  removeTransition(transitionName: string): void;

  enterState(): void;
  exitState(): void;

  /**
   * @param dt Delta time in seconds
   */
  update(dt: number): void;
  destroy(): void;
}
