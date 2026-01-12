import type { Command } from './command.interface';
import type { CommandEnumerator } from './command-enumerator.interface';
import type { CommandPlayer } from './command-player.interface';
import { AbstractCommand } from './abstract-command';
import { SerialCommandEnumerator } from './serial-command-enumerator';
import { ParallelCommandEnumerator } from './parallel-command-enumerator';

export class CommandPlayerImpl extends AbstractCommand implements CommandPlayer {
  private parallelCommandEnumerator: CommandEnumerator | null = null;
  protected layers: CommandEnumerator[] = [];
  protected loopCountValue: number = 0;
  protected currentLoopValue: number = 0;

  private get parallelEnumerator(): CommandEnumerator {
    if (this.parallelCommandEnumerator === null) {
      this.parallelCommandEnumerator = new ParallelCommandEnumerator();
      this.parallelCommandEnumerator.parent = this;
    }
    return this.parallelCommandEnumerator;
  }

  get loopCount(): number {
    return this.loopCountValue;
  }
  set loopCount(value: number) {
    this.loopCountValue = value;
  }

  get currentLoop(): number {
    return this.currentLoopValue;
  }

  get layersCount(): number {
    return this.layers.length;
  }

  addCommand(command: Command, layer?: number): void {
    const layerIndex = layer ?? -1;
    if (layerIndex < 0) {
      this.addCommandToLastLayer(command);
    } else {
      while (this.layersCount <= layerIndex) {
        this.addLayer();
      }
      const targetLayer = this.layers[layerIndex];
      targetLayer.addCommand(command);
    }
  }

  private addCommandToLastLayer(command: Command): void {
    if (this.layersCount <= 0) {
      this.addLayer();
    }
    const layerIndex = this.layersCount - 1;
    const layer = this.layers[layerIndex];
    layer.addCommand(command);
  }

  private addLayer(): void {
    const layer: CommandEnumerator = new SerialCommandEnumerator();
    this.parallelEnumerator.addCommand(layer);
    this.layers.push(layer);
  }

  removeCommand(command: Command, layer?: number): void {
    if (layer === undefined) {
      for (const l of this.layers) {
        if (l.hasCommand(command)) {
          l.removeCommand(command);
          break;
        }
      }
    } else if (this.containsLayer(layer)) {
      const targetLayer = this.layers[layer];
      targetLayer.removeCommand(command);
    }
  }

  hasCommand(command: Command): boolean {
    for (const layer of this.layers) {
      if (layer.hasCommand(command)) {
        return true;
      }
    }
    return false;
  }

  addCommandToLayer(command: Command, layer: number): void {
    this.addCommand(command, layer);
  }

  removeCommandFromLayer(command: Command, layer: number): void {
    this.removeCommand(command, layer);
  }

  getLayerLoopCount(layerIndex: number): number {
    if (this.containsLayer(layerIndex)) {
      const layer = this.layers[layerIndex];
      return layer.loopCount;
    }
    return 0;
  }

  setLayerLoopCount(layerIndex: number, loopCount: number): void {
    if (this.containsLayer(layerIndex)) {
      const layer = this.layers[layerIndex];
      layer.loopCount = loopCount;
    }
  }

  private containsLayer(layerIndex: number): boolean {
    return layerIndex >= 0 && layerIndex < this.layers.length;
  }

  createLayer(loopCount: number = 0): CommandEnumerator {
    const layer: CommandEnumerator = new SerialCommandEnumerator();
    layer.loopCount = loopCount;
    this.parallelEnumerator.addCommand(layer);
    this.layers.push(layer);
    return layer;
  }

  destroyLayer(layerIndex: number): void {
    if (layerIndex < this.layersCount) {
      const selectedLayer = this.layers[layerIndex];
      this.parallelEnumerator.removeCommand(selectedLayer);
      this.layers.splice(layerIndex, 1);
      selectedLayer.destroy();
    }
  }

  handleCompletedCommand(command: Command): void {
    if (!this.completed) {
      if (command === this.parallelEnumerator) {
        if (this.currentLoopValue <= 0 && this.loopCountValue < 0) {
          this.onStart();
        } else if (this.currentLoopValue < this.loopCountValue - 1) {
          const nextLoop = this.currentLoopValue + 1;
          this.onStart();
          this.currentLoopValue = nextLoop;
        } else {
          this.complete();
        }
      }
    }
  }

  protected override onStart(): void {
    this.currentLoopValue = 0;
    this.completed = false;
    this.parallelEnumerator.start();
  }

  protected override onStop(): void {
    this.parallelEnumerator.stop();
  }

  protected override onDestroy(): void {
    this.parallelEnumerator.destroy();
    this.layers.length = 0;
  }
}

export { CommandPlayerImpl as CommandPlayer };
