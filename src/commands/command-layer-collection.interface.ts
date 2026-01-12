import type { Command } from './command.interface';

export interface CommandLayerCollection {
  addCommandToLayer(command: Command, layer: number): void;
  removeCommandFromLayer(command: Command, layer: number): void;
  getLayerLoopCount(layer: number): number;
  setLayerLoopCount(layer: number, loopCount: number): void;
}
