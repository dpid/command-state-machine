import type { Command } from '../commands/command.interface';
import type { CommandLayerCollection } from '../commands/command-layer-collection.interface';
import { AbstractState } from './abstract-state';
import { CommandPlayer } from '../commands/command-player.class';

export class CommandableState extends AbstractState implements CommandLayerCollection {
  private commandPlayer: CommandPlayer | null = null;

  private get player(): CommandPlayer {
    if (this.commandPlayer === null) {
      this.commandPlayer = new CommandPlayer();
    }
    return this.commandPlayer;
  }

  addCommand(command: Command, layer?: number): void {
    if (layer !== undefined) {
      this.player.addCommand(command, layer);
    } else {
      this.player.addCommand(command);
    }
  }

  addCommandToLayer(command: Command, layer: number): void {
    this.player.addCommandToLayer(command, layer);
  }

  removeCommand(command: Command, layer?: number): void {
    if (layer !== undefined) {
      this.player.removeCommand(command, layer);
    } else {
      this.player.removeCommand(command);
    }
  }

  removeCommandFromLayer(command: Command, layer: number): void {
    this.player.removeCommandFromLayer(command, layer);
  }

  getLayerLoopCount(layer: number): number {
    return this.player.getLayerLoopCount(layer);
  }

  setLayerLoopCount(layer: number, loopCount: number): void {
    this.player.setLayerLoopCount(layer, loopCount);
  }

  hasCommand(command: Command): boolean {
    return this.player.hasCommand(command);
  }

  override enterState(): void {
    this.player.start();
  }

  override exitState(): void {
    this.player.stop();
  }

  override destroy(): void {
    this.player.destroy();
  }

  static create(name: string): CommandableState {
    const state = new CommandableState();
    state.name = name;
    return state;
  }
}
