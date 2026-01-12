import type { IState } from './IState';
import { AbstractState } from './AbstractState';

export class SimpleState extends AbstractState {
  static create(name: string): IState {
    const state = new SimpleState();
    state._stateName = name;
    return state;
  }
}
