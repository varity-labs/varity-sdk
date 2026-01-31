import cliProgress from 'cli-progress';
import chalk from 'chalk';

export class ProgressTracker {
  private bar: cliProgress.SingleBar | null = null;

  create(total: number, label: string = 'Migration Progress'): cliProgress.SingleBar {
    this.bar = new cliProgress.SingleBar({
      format: `${label} |${chalk.cyan('{bar}')}| {percentage}% | {value}/{total} objects | {speed} obj/s | ETA: {eta}s`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    });

    this.bar.start(total, 0, {
      speed: '0'
    });

    return this.bar;
  }

  update(current: number, speed?: number): void {
    if (this.bar) {
      this.bar.update(current, {
        speed: speed ? speed.toFixed(2) : '0'
      });
    }
  }

  stop(): void {
    if (this.bar) {
      this.bar.stop();
      this.bar = null;
    }
  }

  increment(delta: number = 1): void {
    if (this.bar) {
      this.bar.increment(delta);
    }
  }
}

export class SpeedCalculator {
  private startTime: number;
  private processedCount: number = 0;

  constructor() {
    this.startTime = Date.now();
  }

  update(count: number): void {
    this.processedCount = count;
  }

  getSpeed(): number {
    const elapsedSeconds = (Date.now() - this.startTime) / 1000;
    return elapsedSeconds > 0 ? this.processedCount / elapsedSeconds : 0;
  }

  getEstimatedTimeRemaining(total: number): number {
    const speed = this.getSpeed();
    const remaining = total - this.processedCount;
    return speed > 0 ? remaining / speed : 0;
  }
}
