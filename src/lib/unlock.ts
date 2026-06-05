export function isUnlockedAt(unlockAt: string, now = Date.now()): boolean {
  return new Date(unlockAt).getTime() <= now;
}
