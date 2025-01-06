export class LoginAttempt {
  private static readonly MAX_ATTEMPTS = 3;
  private attempts: number = 0;
  private lastAttemptTime: Date = new Date();

  incrementAttempt(): boolean {
    this.attempts++;
    this.lastAttemptTime = new Date();
    return this.attempts < LoginAttempt.MAX_ATTEMPTS;
  }

  getRemainingAttempts(): number {
    return LoginAttempt.MAX_ATTEMPTS - this.attempts;
  }

  isLocked(): boolean {
    return this.attempts >= LoginAttempt.MAX_ATTEMPTS;
  }

  reset(): void {
    this.attempts = 0;
  }

  getLastAttemptTime(): Date {
    return this.lastAttemptTime;
  }
}
