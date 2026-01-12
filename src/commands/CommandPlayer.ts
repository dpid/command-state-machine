import type { ICommand } from './ICommand';
import type { ICommandEnumerator } from './ICommandEnumerator';
import type { ICommandPlayer } from './ICommandPlayer';
import { AbstractCommand } from './AbstractCommand';
import { SerialCommandEnumerator } from './SerialCommandEnumerator';
import { ParallelCommandEnumerator } from './ParallelCommandEnumerator';

export class CommandPlayer extends AbstractCommand implements ICommandPlayer {
  private parallelCommandEnumerator: ICommandEnumerator | null = null;
  protected layers: ICommandEnumerator[] = [];
  protected loopCount: number = 0;
  protected currentLoop: number = 0;

  private get ParallelCommandEnumerator(): ICommandEnumerator {
    if (this.parallelCommandEnumerator === null) {
      this.parallelCommandEnumerator = new ParallelCommandEnumerator();
      this.parallelCommandEnumerator.Parent = this;
    }
    return this.parallelCommandEnumerator;
  }

  get LoopCount(): number {
    return this.loopCount;
  }
  set LoopCount(value: number) {
    this.loopCount = value;
  }

  get CurrentLoop(): number {
    return this.currentLoop;
  }

  get LayersCount(): number {
    return this.layers.length;
  }

  AddCommand(command: ICommand, layer?: number): void {
    const layerIndex = layer ?? -1;
    if (layerIndex < 0) {
      this.addCommandToLastLayer(command);
    } else {
      while (this.LayersCount <= layerIndex) {
        this.addLayer();
      }
      const targetLayer = this.layers[layerIndex];
      targetLayer.AddCommand(command);
    }
  }

  private addCommandToLastLayer(command: ICommand): void {
    if (this.LayersCount <= 0) {
      this.addLayer();
    }
    const layerIndex = this.LayersCount - 1;
    const layer = this.layers[layerIndex];
    layer.AddCommand(command);
  }

  private addLayer(): void {
    const layer: ICommandEnumerator = new SerialCommandEnumerator();
    this.ParallelCommandEnumerator.AddCommand(layer);
    this.layers.push(layer);
  }

  RemoveCommand(command: ICommand, layer?: number): void {
    if (layer === undefined) {
      for (const l of this.layers) {
        if (l.HasCommand(command)) {
          l.RemoveCommand(command);
          break;
        }
      }
    } else if (this.containsLayer(layer)) {
      const targetLayer = this.layers[layer];
      targetLayer.RemoveCommand(command);
    }
  }

  HasCommand(command: ICommand): boolean {
    for (const layer of this.layers) {
      if (layer.HasCommand(command)) {
        return true;
      }
    }
    return false;
  }

  AddCommandToLayer(command: ICommand, layer: number): void {
    this.AddCommand(command, layer);
  }

  RemoveCommandFromLayer(command: ICommand, layer: number): void {
    this.RemoveCommand(command, layer);
  }

  GetLayerLoopCount(layerIndex: number): number {
    if (this.containsLayer(layerIndex)) {
      const layer = this.layers[layerIndex];
      return layer.LoopCount;
    }
    return 0;
  }

  SetLayerLoopCount(layerIndex: number, loopCount: number): void {
    if (this.containsLayer(layerIndex)) {
      const layer = this.layers[layerIndex];
      layer.LoopCount = loopCount;
    }
  }

  private containsLayer(layerIndex: number): boolean {
    return layerIndex >= 0 && layerIndex < this.layers.length;
  }

  CreateLayer(loopCount: number = 0): ICommandEnumerator {
    const layer: ICommandEnumerator = new SerialCommandEnumerator();
    layer.LoopCount = loopCount;
    this.ParallelCommandEnumerator.AddCommand(layer);
    this.layers.push(layer);
    return layer;
  }

  DestroyLayer(layerIndex: number): void {
    if (layerIndex < this.LayersCount) {
      const selectedLayer = this.layers[layerIndex];
      this.ParallelCommandEnumerator.RemoveCommand(selectedLayer);
      this.layers.splice(layerIndex, 1);
      selectedLayer.Destroy();
    }
  }

  HandleCompletedCommand(command: ICommand): void {
    if (!this.isCompleted) {
      if (command === this.ParallelCommandEnumerator) {
        if (this.currentLoop <= 0 && this.loopCount < 0) {
          this.onStart();
        } else if (this.currentLoop < this.loopCount - 1) {
          const nextLoop = this.currentLoop + 1;
          this.onStart();
          this.currentLoop = nextLoop;
        } else {
          this.complete();
        }
      }
    }
  }

  protected override onStart(): void {
    this.currentLoop = 0;
    this.isCompleted = false;
    this.ParallelCommandEnumerator.Start();
  }

  protected override onStop(): void {
    this.ParallelCommandEnumerator.Stop();
  }

  protected override onDestroy(): void {
    this.ParallelCommandEnumerator.Destroy();
    this.layers.length = 0;
  }
}
