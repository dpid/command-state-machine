import type { ICommand } from './ICommand';
import type { ICommandEnumerator } from './ICommandEnumerator';
import type { ICommandPlayer } from './ICommandPlayer';
import { AbstractCommand } from './AbstractCommand';
import { SerialCommandEnumerator } from './SerialCommandEnumerator';
import { ParallelCommandEnumerator } from './ParallelCommandEnumerator';

export class CommandPlayer extends AbstractCommand implements ICommandPlayer {
  private parallelCommandEnumerator: ICommandEnumerator | null = null;
  protected layers: ICommandEnumerator[] = [];
  protected _loopCount: number = 0;
  protected _currentLoop: number = 0;

  private get _parallelCommandEnumerator(): ICommandEnumerator {
    if (this.parallelCommandEnumerator === null) {
      this.parallelCommandEnumerator = new ParallelCommandEnumerator();
      this.parallelCommandEnumerator.parent = this;
    }
    return this.parallelCommandEnumerator;
  }

  get loopCount(): number {
    return this._loopCount;
  }
  set loopCount(value: number) {
    this._loopCount = value;
  }

  get currentLoop(): number {
    return this._currentLoop;
  }

  get layersCount(): number {
    return this.layers.length;
  }

  addCommand(command: ICommand, layer?: number): void {
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

  private addCommandToLastLayer(command: ICommand): void {
    if (this.layersCount <= 0) {
      this.addLayer();
    }
    const layerIndex = this.layersCount - 1;
    const layer = this.layers[layerIndex];
    layer.addCommand(command);
  }

  private addLayer(): void {
    const layer: ICommandEnumerator = new SerialCommandEnumerator();
    this._parallelCommandEnumerator.addCommand(layer);
    this.layers.push(layer);
  }

  removeCommand(command: ICommand, layer?: number): void {
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

  hasCommand(command: ICommand): boolean {
    for (const layer of this.layers) {
      if (layer.hasCommand(command)) {
        return true;
      }
    }
    return false;
  }

  addCommandToLayer(command: ICommand, layer: number): void {
    this.addCommand(command, layer);
  }

  removeCommandFromLayer(command: ICommand, layer: number): void {
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

  createLayer(loopCount: number = 0): ICommandEnumerator {
    const layer: ICommandEnumerator = new SerialCommandEnumerator();
    layer.loopCount = loopCount;
    this._parallelCommandEnumerator.addCommand(layer);
    this.layers.push(layer);
    return layer;
  }

  destroyLayer(layerIndex: number): void {
    if (layerIndex < this.layersCount) {
      const selectedLayer = this.layers[layerIndex];
      this._parallelCommandEnumerator.removeCommand(selectedLayer);
      this.layers.splice(layerIndex, 1);
      selectedLayer.destroy();
    }
  }

  handleCompletedCommand(command: ICommand): void {
    if (!this._isCompleted) {
      if (command === this._parallelCommandEnumerator) {
        if (this._currentLoop <= 0 && this._loopCount < 0) {
          this.onStart();
        } else if (this._currentLoop < this._loopCount - 1) {
          const nextLoop = this._currentLoop + 1;
          this.onStart();
          this._currentLoop = nextLoop;
        } else {
          this.complete();
        }
      }
    }
  }

  protected override onStart(): void {
    this._currentLoop = 0;
    this._isCompleted = false;
    this._parallelCommandEnumerator.start();
  }

  protected override onStop(): void {
    this._parallelCommandEnumerator.stop();
  }

  protected override onDestroy(): void {
    this._parallelCommandEnumerator.destroy();
    this.layers.length = 0;
  }
}
