export interface StateTransitionHandler {
  handleTransition(transitionName: string): void;
}
