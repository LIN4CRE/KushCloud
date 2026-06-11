/**
 * Helper class for high score persistence, emulating Android's SharedPreferences.
 * As requested in the implementation document.
 */
export class SharedPreferencesHelper {
  private static PREF_NAME = "HighScores";
  private static KEY_HIGH_SCORE = "HighScore";

  /**
   * Saves the high score to persistent storage if it's higher than the current one.
   * @param score The score achieved in the current run.
   */
  static saveHighScore(score: number): void {
    const currentHighScore = this.getHighScore();
    if (score > currentHighScore) {
      localStorage.setItem(`${this.PREF_NAME}_${this.KEY_HIGH_SCORE}`, score.toString());
    }
  }

  /**
   * Retrieves the persisted high score.
   * @returns The high score, or 0 if none is saved.
   */
  static getHighScore(): number {
    const storedValue = localStorage.getItem(`${this.PREF_NAME}_${this.KEY_HIGH_SCORE}`);
    return storedValue ? parseInt(storedValue, 10) : 0;
  }
}
