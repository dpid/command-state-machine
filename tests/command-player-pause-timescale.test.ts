import { describe, it, expect, vi } from 'vitest';
import {
  AbstractCommand,
  CommandPlayer,
  WaitForTime,
  type Command,
  type CommandPlayerType,
} from '../src';

class TestCommand extends AbstractCommand {
  private shouldCompleteImmediately: boolean;

  constructor(shouldCompleteImmediately: boolean = true) {
    super();
    this.shouldCompleteImmediately = shouldCompleteImmediately;
  }

  protected override onStart(): void {
    if (this.shouldCompleteImmediately) {
      this.complete();
    }
  }

  completeManually(): void {
    this.complete();
  }

  static create(shouldCompleteImmediately: boolean = true): Command {
    return new TestCommand(shouldCompleteImmediately);
  }
}

describe('CommandPlayer - Pause/Resume', () => {
  describe('Initial state', () => {
    it('should start unpaused', () => {
      const player = new CommandPlayer();
      expect(player.isPaused).toBe(false);
    });

    it('should have default timeScale of 1.0', () => {
      const player = new CommandPlayer();
      expect(player.timeScale).toBe(1.0);
    });
  });

  describe('Pause state management', () => {
    it('should set isPaused to true when pause() is called', () => {
      const player = new CommandPlayer();
      player.pause();
      expect(player.isPaused).toBe(true);
    });

    it('should set isPaused to false when resume() is called', () => {
      const player = new CommandPlayer();
      player.pause();
      player.resume();
      expect(player.isPaused).toBe(false);
    });

    it('should handle multiple pause calls idempotently', () => {
      const player = new CommandPlayer();
      player.pause();
      player.pause();
      player.pause();
      expect(player.isPaused).toBe(true);
    });

    it('should handle multiple resume calls idempotently', () => {
      const player = new CommandPlayer();
      player.pause();
      player.resume();
      player.resume();
      player.resume();
      expect(player.isPaused).toBe(false);
    });
  });

  describe('Pause behavior during command execution', () => {
    it('should stop command progression when paused', () => {
      const player = new CommandPlayer();
      const wait = WaitForTime.create(1.0);
      player.addCommand(wait);
      player.start();

      player.update(0.5);
      expect(wait.isCompleted).toBe(false);

      player.pause();
      player.update(0.6);
      expect(wait.isCompleted).toBe(false);
    });

    it('should resume command progression when resumed', () => {
      const player = new CommandPlayer();
      const wait = WaitForTime.create(1.0);
      player.addCommand(wait);
      player.start();

      player.update(0.4);
      expect(wait.isCompleted).toBe(false);

      player.pause();
      player.update(1.0);
      expect(wait.isCompleted).toBe(false);

      player.resume();
      player.update(0.6);
      expect(wait.isCompleted).toBe(true);
    });

    it('should preserve elapsed time when paused and resumed', () => {
      const player = new CommandPlayer();
      const wait = WaitForTime.create(1.0);
      player.addCommand(wait);
      player.start();

      player.update(0.3);
      player.pause();
      player.update(0.5);
      player.resume();
      player.update(0.7);

      expect(wait.isCompleted).toBe(true);
    });

    it('should maintain pause state across command transitions in serial sequence', () => {
      const player = new CommandPlayer();
      const cmd1 = TestCommand.create(true);
      const cmd2 = WaitForTime.create(1.0);
      player.addCommand(cmd1);
      player.addCommand(cmd2);
      player.start();

      player.pause();
      player.update(1.0);

      expect(cmd2.isCompleted).toBe(false);
    });
  });

  describe('Pause edge cases', () => {
    it('should allow pausing before start', () => {
      const player = new CommandPlayer();
      const wait = WaitForTime.create(1.0);
      player.addCommand(wait);

      player.pause();
      player.start();
      player.update(1.0);

      expect(wait.isCompleted).toBe(false);
      expect(player.isPaused).toBe(true);
    });

    it('should remain paused after start until resume is called', () => {
      const player = new CommandPlayer();
      const wait = WaitForTime.create(1.0);
      player.addCommand(wait);

      player.pause();
      player.start();
      player.update(0.5);
      expect(player.isPaused).toBe(true);
      expect(wait.isCompleted).toBe(false);

      player.resume();
      player.update(1.0);
      expect(wait.isCompleted).toBe(true);
    });

    it('should allow pausing already completed player without error', () => {
      const player = new CommandPlayer();
      const cmd = TestCommand.create(true);
      player.addCommand(cmd);
      player.start();

      expect(player.isCompleted).toBe(true);
      expect(() => player.pause()).not.toThrow();
      expect(player.isPaused).toBe(true);
    });

    it('should allow resuming empty player without error', () => {
      const player = new CommandPlayer();
      player.pause();
      expect(() => player.resume()).not.toThrow();
      expect(player.isPaused).toBe(false);
    });
  });
});

describe('CommandPlayer - Time Scaling', () => {
  describe('Time scale property', () => {
    it('should allow setting timeScale', () => {
      const player = new CommandPlayer();
      player.timeScale = 2.0;
      expect(player.timeScale).toBe(2.0);
    });

    it('should allow changing timeScale mid-execution', () => {
      const player = new CommandPlayer();
      const wait = WaitForTime.create(1.0);
      player.addCommand(wait);
      player.start();

      player.timeScale = 0.5;
      player.update(0.5);
      expect(wait.isCompleted).toBe(false);

      player.timeScale = 2.0;
      player.update(0.375);
      expect(wait.isCompleted).toBe(true);
    });
  });

  describe('Time scale effects on command execution', () => {
    it('should make commands take twice as long with timeScale = 0.5', () => {
      const player = new CommandPlayer();
      const wait = WaitForTime.create(1.0);
      player.addCommand(wait);
      player.start();

      player.timeScale = 0.5;
      player.update(1.0);
      expect(wait.isCompleted).toBe(false);

      player.update(1.0);
      expect(wait.isCompleted).toBe(true);
    });

    it('should make commands complete twice as fast with timeScale = 2.0', () => {
      const player = new CommandPlayer();
      const wait = WaitForTime.create(1.0);
      player.addCommand(wait);
      player.start();

      player.timeScale = 2.0;
      player.update(0.5);
      expect(wait.isCompleted).toBe(true);
    });

    it('should stop progression with timeScale = 0', () => {
      const player = new CommandPlayer();
      const wait = WaitForTime.create(1.0);
      player.addCommand(wait);
      player.start();

      player.timeScale = 0;
      player.update(1.0);
      expect(wait.isCompleted).toBe(false);

      player.timeScale = 1.0;
      player.update(1.0);
      expect(wait.isCompleted).toBe(true);
    });

    it('should apply time scale to all layers', () => {
      const player = new CommandPlayer();
      const wait1 = WaitForTime.create(1.0);
      const wait2 = WaitForTime.create(1.0);
      player.addCommand(wait1, 0);
      player.addCommand(wait2, 1);
      player.start();

      player.timeScale = 2.0;
      player.update(0.5);

      expect(wait1.isCompleted).toBe(true);
      expect(wait2.isCompleted).toBe(true);
    });

    it('should work with very small timeScale values', () => {
      const player = new CommandPlayer();
      const wait = WaitForTime.create(1.0);
      player.addCommand(wait);
      player.start();

      player.timeScale = 0.001;
      player.update(1.0);
      expect(wait.isCompleted).toBe(false);

      player.update(999.0);
      expect(wait.isCompleted).toBe(true);
    });

    it('should work with very large timeScale values', () => {
      const player = new CommandPlayer();
      const wait = WaitForTime.create(1000.0);
      player.addCommand(wait);
      player.start();

      player.timeScale = 1000;
      player.update(1.0);
      expect(wait.isCompleted).toBe(true);
    });
  });

  describe('Time scale validation', () => {
    it('should clamp negative timeScale to 0', () => {
      const player = new CommandPlayer();
      const wait = WaitForTime.create(1.0);
      player.addCommand(wait);
      player.start();

      player.timeScale = -1;
      player.update(1.0);
      expect(wait.isCompleted).toBe(false);

      player.timeScale = 1.0;
      player.update(1.0);
      expect(wait.isCompleted).toBe(true);
    });

    it('should handle NaN timeScale gracefully', () => {
      const player = new CommandPlayer();
      const wait = WaitForTime.create(1.0);
      player.addCommand(wait);
      player.start();

      player.timeScale = NaN;
      player.update(1.0);
      expect(wait.isCompleted).toBe(false);
    });

    it('should handle Infinity timeScale', () => {
      const player = new CommandPlayer();
      const wait = WaitForTime.create(1.0);
      player.addCommand(wait);
      player.start();

      player.timeScale = Infinity;
      player.update(0.001);
      expect(wait.isCompleted).toBe(true);
    });
  });
});

describe('CommandPlayer - Combined Pause and Time Scale', () => {
  describe('Pause precedence', () => {
    it('should not progress when paused regardless of timeScale', () => {
      const player = new CommandPlayer();
      const wait = WaitForTime.create(1.0);
      player.addCommand(wait);
      player.start();

      player.timeScale = 2.0;
      player.pause();
      player.update(1.0);

      expect(wait.isCompleted).toBe(false);
    });

    it('should apply timeScale when resumed', () => {
      const player = new CommandPlayer();
      const wait = WaitForTime.create(1.0);
      player.addCommand(wait);
      player.start();

      player.timeScale = 2.0;
      player.pause();
      player.update(1.0);
      expect(wait.isCompleted).toBe(false);

      player.resume();
      player.update(0.5);
      expect(wait.isCompleted).toBe(true);
    });

    it('should distinguish between pause and timeScale = 0', () => {
      const player = new CommandPlayer();
      player.timeScale = 0;
      expect(player.isPaused).toBe(false);

      player.pause();
      expect(player.isPaused).toBe(true);
      expect(player.timeScale).toBe(0);
    });

    it('should allow pause when timeScale is 0', () => {
      const player = new CommandPlayer();
      const wait = WaitForTime.create(1.0);
      player.addCommand(wait);
      player.start();

      player.timeScale = 0;
      player.pause();
      expect(player.isPaused).toBe(true);

      player.resume();
      player.update(1.0);
      expect(wait.isCompleted).toBe(false);

      player.timeScale = 1.0;
      player.update(1.0);
      expect(wait.isCompleted).toBe(true);
    });

    it('should store timeScale changes while paused', () => {
      const player = new CommandPlayer();
      const wait = WaitForTime.create(1.0);
      player.addCommand(wait);
      player.start();

      player.pause();
      player.timeScale = 2.0;
      expect(player.timeScale).toBe(2.0);

      player.resume();
      player.update(0.5);
      expect(wait.isCompleted).toBe(true);
    });
  });
});

describe('CommandPlayer - Integration with Existing Features', () => {
  describe('Pause/resume with looping', () => {
    it('should maintain pause state across loop iterations', () => {
      const player = new CommandPlayer();
      player.loopCount = 2;
      const wait = WaitForTime.create(0.5);
      player.addCommand(wait);
      player.start();

      player.update(0.5);
      expect(player.currentLoop).toBe(1);

      player.pause();
      player.update(0.5);
      expect(player.currentLoop).toBe(1);
      expect(player.isPaused).toBe(true);

      player.resume();
      player.update(0.5);
      expect(player.isCompleted).toBe(true);
    });

    it('should apply timeScale across loop iterations', () => {
      const player = new CommandPlayer();
      player.loopCount = 2;
      const wait = WaitForTime.create(1.0);
      player.addCommand(wait);
      player.start();

      player.timeScale = 2.0;
      player.update(0.5);
      expect(player.currentLoop).toBe(1);

      player.update(0.5);
      expect(player.isCompleted).toBe(true);
    });
  });

  describe('Pause/resume with multi-layer', () => {
    it('should pause all layers', () => {
      const player = new CommandPlayer();
      const wait1 = WaitForTime.create(1.0);
      const wait2 = WaitForTime.create(1.0);
      player.addCommand(wait1, 0);
      player.addCommand(wait2, 1);
      player.start();

      player.update(0.5);
      player.pause();
      player.update(1.0);

      expect(wait1.isCompleted).toBe(false);
      expect(wait2.isCompleted).toBe(false);
    });

    it('should resume all layers', () => {
      const player = new CommandPlayer();
      const wait1 = WaitForTime.create(1.0);
      const wait2 = WaitForTime.create(1.0);
      player.addCommand(wait1, 0);
      player.addCommand(wait2, 1);
      player.start();

      player.update(0.5);
      player.pause();
      player.update(1.0);
      player.resume();
      player.update(0.5);

      expect(wait1.isCompleted).toBe(true);
      expect(wait2.isCompleted).toBe(true);
    });
  });

  describe('Pause/resume from callbacks', () => {
    it('should allow pausing from completion callback', () => {
      const player = new CommandPlayer();
      const cmd1 = TestCommand.create(true);
      const wait = WaitForTime.create(1.0);

      cmd1.addCompletionListener(() => {
        player.pause();
      });

      player.addCommand(cmd1);
      player.addCommand(wait);
      player.start();

      expect(player.isPaused).toBe(true);
      player.update(1.0);
      expect(wait.isCompleted).toBe(false);
    });

    it('should allow resuming from completion callback', () => {
      const player = new CommandPlayer();
      const cmd1 = TestCommand.create(true);
      const wait = WaitForTime.create(1.0);

      player.pause();
      cmd1.addCompletionListener(() => {
        player.resume();
      });

      player.addCommand(cmd1);
      player.addCommand(wait);
      player.start();

      player.update(1.0);
      expect(wait.isCompleted).toBe(true);
    });

    it('should allow changing timeScale from completion callback', () => {
      const player = new CommandPlayer();
      const cmd1 = TestCommand.create(true);
      const wait = WaitForTime.create(1.0);

      cmd1.addCompletionListener(() => {
        player.timeScale = 2.0;
      });

      player.addCommand(cmd1);
      player.addCommand(wait);
      player.start();

      expect(player.timeScale).toBe(2.0);
      player.update(0.5);
      expect(wait.isCompleted).toBe(true);
    });
  });

  describe('Interface compatibility', () => {
    it('should expose pause/resume/isPaused on CommandPlayer interface', () => {
      const player: CommandPlayerType = new CommandPlayer();

      expect(typeof player.pause).toBe('function');
      expect(typeof player.resume).toBe('function');
      expect(typeof player.isPaused).toBe('boolean');
      expect(typeof player.timeScale).toBe('number');
    });

    it('should allow calling pause/resume through interface', () => {
      const player: CommandPlayerType = new CommandPlayer();
      const wait = WaitForTime.create(1.0);
      player.addCommand(wait);
      player.start();

      player.pause();
      expect(player.isPaused).toBe(true);
      player.update(1.0);
      expect(wait.isCompleted).toBe(false);

      player.resume();
      expect(player.isPaused).toBe(false);
      player.update(1.0);
      expect(wait.isCompleted).toBe(true);
    });

    it('should allow setting timeScale through interface', () => {
      const player: CommandPlayerType = new CommandPlayer();
      const wait = WaitForTime.create(1.0);
      player.addCommand(wait);
      player.start();

      player.timeScale = 2.0;
      player.update(0.5);
      expect(wait.isCompleted).toBe(true);
    });
  });
});

describe('CommandPlayer - Real-world Usage Patterns', () => {
  it('should support pause menu scenario', () => {
    const player = new CommandPlayer();
    const wait = WaitForTime.create(5.0);
    player.addCommand(wait);
    player.start();

    player.update(2.0);
    expect(wait.isCompleted).toBe(false);

    player.pause();
    player.update(10.0);
    expect(wait.isCompleted).toBe(false);

    player.resume();
    player.update(3.0);
    expect(wait.isCompleted).toBe(true);
  });

  it('should support slow-motion effect', () => {
    const player = new CommandPlayer();
    const wait = WaitForTime.create(1.0);
    player.addCommand(wait);
    player.start();

    player.timeScale = 0.2;
    player.update(1.0);
    expect(wait.isCompleted).toBe(false);

    player.update(4.0);
    expect(wait.isCompleted).toBe(true);
  });

  it('should support fast-forward cutscene', () => {
    const player = new CommandPlayer();
    const wait = WaitForTime.create(10.0);
    player.addCommand(wait);
    player.start();

    player.timeScale = 5.0;
    player.update(2.0);
    expect(wait.isCompleted).toBe(true);
  });

  it('should support bullet-time mechanics (pause with selective resume)', () => {
    const player = new CommandPlayer();
    const wait = WaitForTime.create(2.0);
    player.addCommand(wait);
    player.start();

    player.update(0.5);
    player.timeScale = 0.1;
    player.update(1.0);
    expect(wait.isCompleted).toBe(false);

    player.timeScale = 1.0;
    player.update(1.5);
    expect(wait.isCompleted).toBe(true);
  });
});
