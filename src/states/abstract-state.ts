import type { State } from './state.interface';
import type { StateMachine } from './state-machine.interface';

export abstract class AbstractState implements State {
  protected name: string = '';
  protected machine: StateMachine | null = null;
  protected transitionNamesToStateNames: Map<string, string> = new Map();
  protected parentState: State | null = null;
  protected childStates: Map<string, State> = new Map();
  protected lastChild: State | null = null;

  get stateName(): string {
    return this.name;
  }

  get stateMachine(): StateMachine | null {
    return this.machine;
  }
  set stateMachine(value: StateMachine | null) {
    this.machine = value;
    this.childStates.forEach((child) => {
      child.stateMachine = value;
    });
  }

  get parent(): State | null {
    return this.parentState;
  }

  get children(): readonly State[] {
    return Array.from(this.childStates.values());
  }

  get lastActiveChild(): State | null {
    return this.lastChild;
  }

  addTransition(transitionName: string, toStateOrName: State | string): void {
    if (typeof toStateOrName === 'string') {
      if (!transitionName || !toStateOrName) return;
      this.transitionNamesToStateNames.set(transitionName, toStateOrName);
    } else {
      if (toStateOrName === null) return;
      const targetPath = toStateOrName.parent !== null
        ? toStateOrName.getStatePath()
        : toStateOrName.stateName;
      this.addTransition(transitionName, targetPath);
    }
  }

  removeTransition(transitionName: string): void {
    if (!transitionName) return;
    this.transitionNamesToStateNames.delete(transitionName);
  }

  handleTransition(transitionName: string): void {
    if (!transitionName?.trim()) return;
    if (this.machine === null) return;

    const definingState = this.findTransition(transitionName);
    if (definingState === null) return;

    const targetName = (definingState as AbstractState).transitionNamesToStateNames.get(transitionName);
    if (targetName === undefined) return;

    if (targetName.includes('.')) {
      const resolvedState = this.resolveHierarchicalPath(targetName);
      if (resolvedState !== null) {
        this.transitionTo(resolvedState);
      } else {
        this.machine.setState(targetName);
      }
    } else {
      const resolvedState = this.resolveTransitionTarget(targetName);
      if (resolvedState !== null) {
        this.transitionTo(resolvedState);
      } else {
        this.machine.setState(targetName);
      }
    }
  }

  private resolveHierarchicalPath(path: string): State | null {
    let root: State | null = this;
    while (root.parent !== null) {
      root = root.parent;
    }

    const parts = path.split('.');
    if (parts.length === 0 || parts[0] !== root.stateName) {
      return null;
    }

    let current: State = root;
    for (let i = 1; i < parts.length; i++) {
      const child = (current as AbstractState).childStates.get(parts[i]);
      if (child === undefined) {
        return null;
      }
      current = child;
    }

    return current;
  }

  private findTransition(transitionName: string): State | null {
    if (this.transitionNamesToStateNames.has(transitionName)) {
      return this;
    }

    if (this.parentState !== null) {
      return (this.parentState as AbstractState).findTransition(transitionName);
    }

    return null;
  }

  private resolveTransitionTarget(targetName: string): State | null {
    if (targetName.includes('.')) {
      return null;
    }

    let current: State | null = this.parentState;
    while (current !== null) {
      if (current.stateName === targetName) {
        return current;
      }

      const sibling = (current as AbstractState).childStates.get(targetName);
      if (sibling !== undefined) {
        return sibling;
      }

      current = current.parent;
    }

    return null;
  }

  addSubstate(child: State): void {
    if (child.stateMachine !== null) {
      throw new Error('Cannot add state that is already registered with a StateMachine as a substate');
    }

    if (this.isAncestorOf(child)) {
      throw new Error('Cannot add ancestor as substate (would create circular reference)');
    }

    if (this.childStates.has(child.stateName)) {
      throw new Error(`Cannot add substate: sibling with name '${child.stateName}' already exists`);
    }

    (child as AbstractState).parentState = this;

    if (this.machine !== null) {
      child.stateMachine = this.machine;
    }

    this.childStates.set(child.stateName, child);
  }

  removeSubstate(child: State): void {
    if (!this.childStates.has(child.stateName)) {
      return;
    }

    if (this.machine !== null && this.isActiveInHierarchy(child)) {
      child.exitState();
      this.exitActiveSubtree(child);
    }

    this.childStates.delete(child.stateName);
    (child as AbstractState).parentState = null;
    this.clearStateMachineRecursive(child);
  }

  private isAncestorOf(state: State): boolean {
    let current: State | null = this.parentState;
    while (current !== null) {
      if (current === state) {
        return true;
      }
      current = current.parent;
    }
    return false;
  }

  private isActiveInHierarchy(state: State): boolean {
    if (this.machine === null || this.machine.currentState === null) {
      return false;
    }

    let current: State | null = this.machine.currentState;
    while (current !== null) {
      if (current === state) {
        return true;
      }
      current = current.parent;
    }
    return false;
  }

  private exitActiveSubtree(state: State): void {
    state.children.forEach((child) => {
      if (this.isActiveInHierarchy(child)) {
        child.exitState();
        this.exitActiveSubtree(child);
      }
    });
  }

  private clearStateMachineRecursive(state: State): void {
    state.stateMachine = null;
    state.children.forEach((child) => {
      this.clearStateMachineRecursive(child);
    });
  }

  getStatePath(): string {
    const pathParts: string[] = [];
    let current: State | null = this;

    while (current !== null) {
      pathParts.unshift(current.stateName);
      current = current.parent;
    }

    return pathParts.join('.');
  }

  enterPath(pathSegment: string): State | null {
    const trimmed = pathSegment?.trim() ?? '';

    if (trimmed === '') {
      this.enterState();
      return this;
    }

    let childName: string;
    let remainingPath: string;

    const dotIndex = trimmed.indexOf('.');
    if (dotIndex !== -1) {
      childName = trimmed.substring(0, dotIndex);
      remainingPath = trimmed.substring(dotIndex + 1);

      if (childName === '' || remainingPath === '') {
        return null;
      }
    } else {
      childName = trimmed;
      remainingPath = '';
    }

    const child = this.childStates.get(childName);
    if (child === undefined) {
      return null;
    }

    this.enterState();
    this.lastChild = child;

    return child.enterPath(remainingPath);
  }

  transitionTo(targetState: State): void {
    if (targetState === this) {
      return;
    }

    const commonAncestor = this.findCommonAncestor(targetState);

    this.exitToAncestor(commonAncestor);

    if (commonAncestor !== null) {
      const pathFromAncestor = this.buildPathFromAncestor(commonAncestor, targetState);

      if (pathFromAncestor !== '') {
        const leafState = (commonAncestor as AbstractState).enterPathWithoutSelf(pathFromAncestor);

        if (leafState !== null && this.machine !== null) {
          (this.machine as any).activeState = leafState;
          (commonAncestor as AbstractState).lastChild = this.findDirectChild(commonAncestor, leafState);
        }
      } else {
        if (this.machine !== null) {
          (this.machine as any).activeState = commonAncestor;
        }
      }
    }
  }

  private enterPathWithoutSelf(pathSegment: string): State | null {
    const trimmed = pathSegment?.trim() ?? '';

    if (trimmed === '') {
      return this;
    }

    let childName: string;
    let remainingPath: string;

    const dotIndex = trimmed.indexOf('.');
    if (dotIndex !== -1) {
      childName = trimmed.substring(0, dotIndex);
      remainingPath = trimmed.substring(dotIndex + 1);

      if (childName === '' || remainingPath === '') {
        return null;
      }
    } else {
      childName = trimmed;
      remainingPath = '';
    }

    const child = this.childStates.get(childName);
    if (child === undefined) {
      return null;
    }

    this.lastChild = child;
    return child.enterPath(remainingPath);
  }

  private findDirectChild(ancestor: State, descendant: State): State | null {
    let current: State | null = descendant;

    while (current !== null && current.parent !== ancestor) {
      current = current.parent;
    }

    return current;
  }

  private findCommonAncestor(other: State): State | null {
    const ancestors = new Set<State>();
    let current: State | null = this;

    while (current !== null) {
      ancestors.add(current);
      current = current.parent;
    }

    current = other;
    while (current !== null) {
      if (ancestors.has(current)) {
        return current;
      }
      current = current.parent;
    }

    return null;
  }

  private exitToAncestor(ancestor: State | null): void {
    this.exitState();

    if (this.parentState !== null && this.parentState !== ancestor) {
      (this.parentState as AbstractState).exitToAncestor(ancestor);
    }
  }

  private buildPathFromAncestor(ancestor: State, target: State): string {
    const pathParts: string[] = [];
    let current: State | null = target;

    while (current !== null && current !== ancestor) {
      pathParts.unshift(current.stateName);
      current = current.parent;
    }

    return pathParts.join('.');
  }

  enterWithHistory(): State | null {
    this.enterState();

    if (this.lastChild !== null) {
      return this.lastChild.enterWithHistory();
    }

    return this;
  }

  enterState(): void {}
  exitState(): void {}
  update(_dt: number): void {}

  destroy(): void {
    this.childStates.forEach((child) => {
      child.destroy();
    });
    this.childStates.clear();
  }
}
