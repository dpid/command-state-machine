import type { CommandEnumerator } from './command-enumerator.interface';
import type { CommandLayerCollection } from './command-layer-collection.interface';

export interface CommandPlayer extends CommandEnumerator, CommandLayerCollection {}
