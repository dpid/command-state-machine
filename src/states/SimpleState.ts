import type { IState } from './IState';
import { AbstractState } from './AbstractState';

export class SimpleState extends AbstractState {
  static Create(name: string): IState {
    const state = new SimpleState();
    state.stateName = name;
    return state;
  }
}
