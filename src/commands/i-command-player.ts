import type { ICommandEnumerator } from './i-command-enumerator';
import type { ICommandLayerCollection } from './i-command-layer-collection';

export interface ICommandPlayer extends ICommandEnumerator, ICommandLayerCollection {}
