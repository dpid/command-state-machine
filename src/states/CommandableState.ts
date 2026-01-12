import type { ICommand } from '../commands/ICommand';
import type { ICommandLayerCollection } from '../commands/ICommandLayerCollection';
import { AbstractState } from './AbstractState';
import { CommandPlayer } from '../commands/CommandPlayer';

export class CommandableState extends AbstractState implements ICommandLayerCollection {
  private commandPlayer: CommandPlayer | null = null;

  private get _commandPlayer(): CommandPlayer {
    if (this.commandPlayer === null) {
      this.commandPlayer = new CommandPlayer();
    }
    return this.commandPlayer;
  }

  addCommand(command: ICommand, layer?: number): void {
    if (layer !== undefined) {
      this._commandPlayer.addCommand(command, layer);
    } else {
      this._commandPlayer.addCommand(command);
    }
  }

  addCommandToLayer(command: ICommand, layer: number): void {
    this._commandPlayer.addCommandToLayer(command, layer);
  }

  removeCommand(command: ICommand, layer?: number): void {
    if (layer !== undefined) {
      this._commandPlayer.removeCommand(command, layer);
    } else {
      this._commandPlayer.removeCommand(command);
    }
  }

  removeCommandFromLayer(command: ICommand, layer: number): void {
    this._commandPlayer.removeCommandFromLayer(command, layer);
  }

  getLayerLoopCount(layer: number): number {
    return this._commandPlayer.getLayerLoopCount(layer);
  }

  setLayerLoopCount(layer: number, loopCount: number): void {
    this._commandPlayer.setLayerLoopCount(layer, loopCount);
  }

  hasCommand(command: ICommand): boolean {
    return this._commandPlayer.hasCommand(command);
  }

  override enterState(): void {
    this._commandPlayer.start();
  }

  override exitState(): void {
    this._commandPlayer.stop();
  }

  override destroy(): void {
    this._commandPlayer.destroy();
  }

  static create(name: string): CommandableState {
    const state = new CommandableState();
    state._stateName = name;
    return state;
  }
}
