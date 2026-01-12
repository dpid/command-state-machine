export interface IStateTransitionHandler {
  handleTransition(transitionName: string): void;
}
