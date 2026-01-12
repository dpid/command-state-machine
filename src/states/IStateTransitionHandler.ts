export interface IStateTransitionHandler {
  HandleTransition(transitionName: string): void;
}
