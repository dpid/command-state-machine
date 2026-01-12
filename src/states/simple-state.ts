import type { State } from './state.interface';
import { AbstractState } from './abstract-state';

export class SimpleState extends AbstractState {
  static create(name: string): State {
    const state = new SimpleState();
    state.name = name;
    return state;
  }
}
