import { describe, it, expect } from 'vitest';
import { StateMachine, SimpleState } from '../src';

describe('Transition Guards - Usage Example', () => {
  it('should prevent pausing during cutscene', () => {
    const gameState = { inCutscene: false };

    const playing = SimpleState.create('Playing');
    const paused = SimpleState.create('Paused');

    playing.addTransition('pause', paused, () => !gameState.inCutscene);

    const sm = StateMachine.create();
    sm.addState(playing);
    sm.addState(paused);
    sm.setState('Playing');

    gameState.inCutscene = true;
    sm.handleTransition('pause');
    expect(sm.currentState).toBe(playing);

    gameState.inCutscene = false;
    sm.handleTransition('pause');
    expect(sm.currentState).toBe(paused);
  });

  it('should allow transition only when player has key', () => {
    const inventory = { hasKey: false };

    const outsideDoor = SimpleState.create('OutsideDoor');
    const insideRoom = SimpleState.create('InsideRoom');

    outsideDoor.addTransition('openDoor', insideRoom, () => inventory.hasKey);

    const sm = StateMachine.create();
    sm.addState(outsideDoor);
    sm.addState(insideRoom);
    sm.setState('OutsideDoor');

    sm.handleTransition('openDoor');
    expect(sm.currentState).toBe(outsideDoor);

    inventory.hasKey = true;
    sm.handleTransition('openDoor');
    expect(sm.currentState).toBe(insideRoom);
  });

  it('should check resource requirements before state change', () => {
    const resources = { energy: 0, maxEnergy: 100 };

    const idle = SimpleState.create('Idle');
    const dashing = SimpleState.create('Dashing');

    const dashCost = 25;
    idle.addTransition('dash', dashing, () => resources.energy >= dashCost);

    const sm = StateMachine.create();
    sm.addState(idle);
    sm.addState(dashing);
    sm.setState('Idle');

    resources.energy = 10;
    sm.handleTransition('dash');
    expect(sm.currentState).toBe(idle);

    resources.energy = 50;
    sm.handleTransition('dash');
    expect(sm.currentState).toBe(dashing);
  });
});
