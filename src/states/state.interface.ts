import type { StateTransitionHandler } from './state-transition-handler.interface';
import type { StateMachine } from './state-machine.interface';

export interface State extends StateTransitionHandler {
  readonly stateName: string;

  stateMachine: StateMachine | null;

  readonly parent: State | null;
  readonly children: readonly State[];
  readonly lastActiveChild: State | null;

  addTransition(transitionName: string, toState: State): void;
  addTransition(transitionName: string, toStateName: string): void;
  removeTransition(transitionName: string): void;

  addSubstate(child: State): void;
  removeSubstate(child: State): void;
  getStatePath(): string;
  enterPath(pathSegment: string): State | null;
  transitionTo(targetState: State): void;
  enterWithHistory(): State | null;

  enterState(): void;
  exitState(): void;

  /**
   * @param dt Delta time in seconds
   */
  update(dt: number): void;
  destroy(): void;
}
