import type { ICommand } from '../commands/ICommand';
import type { ICommandLayerCollection } from '../commands/ICommandLayerCollection';
import { AbstractState } from './AbstractState';
import { CommandPlayer } from '../commands/CommandPlayer';

export class CommandableState extends AbstractState implements ICommandLayerCollection {
  private commandPlayer: CommandPlayer | null = null;

  private get CommandPlayer(): CommandPlayer {
    if (this.commandPlayer === null) {
      this.commandPlayer = new CommandPlayer();
    }
    return this.commandPlayer;
  }

  AddCommand(command: ICommand, layer?: number): void {
    if (layer !== undefined) {
      this.CommandPlayer.AddCommand(command, layer);
    } else {
      this.CommandPlayer.AddCommand(command);
    }
  }

  AddCommandToLayer(command: ICommand, layer: number): void {
    this.CommandPlayer.AddCommandToLayer(command, layer);
  }

  RemoveCommand(command: ICommand, layer?: number): void {
    if (layer !== undefined) {
      this.CommandPlayer.RemoveCommand(command, layer);
    } else {
      this.CommandPlayer.RemoveCommand(command);
    }
  }

  RemoveCommandFromLayer(command: ICommand, layer: number): void {
    this.CommandPlayer.RemoveCommandFromLayer(command, layer);
  }

  GetLayerLoopCount(layer: number): number {
    return this.CommandPlayer.GetLayerLoopCount(layer);
  }

  SetLayerLoopCount(layer: number, loopCount: number): void {
    this.CommandPlayer.SetLayerLoopCount(layer, loopCount);
  }

  HasCommand(command: ICommand): boolean {
    return this.CommandPlayer.HasCommand(command);
  }

  override EnterState(): void {
    this.CommandPlayer.Start();
  }

  override ExitState(): void {
    this.CommandPlayer.Stop();
  }

  override Destroy(): void {
    this.CommandPlayer.Destroy();
  }

  static Create(name: string): CommandableState {
    const state = new CommandableState();
    state.stateName = name;
    return state;
  }
}
