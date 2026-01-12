import type { ICommand } from './ICommand';

export interface ICommandLayerCollection {
  addCommandToLayer(command: ICommand, layer: number): void;
  removeCommandFromLayer(command: ICommand, layer: number): void;
  getLayerLoopCount(layer: number): number;
  setLayerLoopCount(layer: number, loopCount: number): void;
}
