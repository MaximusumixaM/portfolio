// The globe's turn between journey stops — performed, not scrubbed: crossing a chapter's exit
// starts it and it plays out over time. JourneyDirector advances it; the globe and the chapter
// palette both read it, so the colour morph is the spin.

export interface JourneySpin {
  /** Bumps whenever a fresh spin starts (not on a reversal), so readers can tell the two apart. */
  serial: number;
  from: number;
  to: number;
  /** 0–1, linear in time; readers ease it. */
  progress: number;
}

const SPIN_SECONDS = 1.2;

let spin: JourneySpin = { serial: 0, from: -1, to: -1, progress: 1 };

export function getJourneySpin(): Readonly<JourneySpin> {
  return spin;
}

export function spinTo(stop: number): void {
  if (stop === spin.to) return;
  // Scrolling back mid-turn reverses the spin in place rather than restarting it.
  if (stop === spin.from && spin.progress < 1) {
    spin = { ...spin, from: spin.to, to: stop, progress: 1 - spin.progress };
    return;
  }
  spin = { serial: spin.serial + 1, from: spin.to, to: stop, progress: 0 };
}

export function advanceSpin(seconds: number): void {
  if (spin.progress >= 1) return;
  spin = {
    ...spin,
    progress: Math.min(1, spin.progress + seconds / SPIN_SECONDS),
  };
}

/** Lands the spin straight away, for reduced motion. */
export function finishSpin(): void {
  if (spin.progress < 1) spin = { ...spin, progress: 1 };
}
