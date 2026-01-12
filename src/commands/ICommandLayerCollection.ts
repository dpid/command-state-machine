import type { ICommand } from './ICommand';

export interface ICommandLayerCollection {
  AddCommandToLayer(command: ICommand, layer: number): void;
  RemoveCommandFromLayer(command: ICommand, layer: number): void;
  GetLayerLoopCount(layer: number): number;
  SetLayerLoopCount(layer: number, loopCount: number): void;
}
