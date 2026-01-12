import type { IState } from './i-state';
import { AbstractState } from './abstract-state';

export class SimpleState extends AbstractState {
  static create(name: string): IState {
    const state = new SimpleState();
    state._stateName = name;
    return state;
  }
}
