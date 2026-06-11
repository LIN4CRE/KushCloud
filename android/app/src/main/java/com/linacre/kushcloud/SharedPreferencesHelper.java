package com.linacre.kushcloud;

import android.content.Context;
import android.content.SharedPreferences;

/**
 * Helper class for high score persistence using Android's SharedPreferences.
 * As requested in the implementation document.
 */
public class SharedPreferencesHelper {
    private static final String PREF_NAME = "HighScores";
    private static final String KEY_HIGH_SCORE = "HighScore";
    private final SharedPreferences sharedPreferences;

    public SharedPreferencesHelper(Context context) {
        this.sharedPreferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
    }

    /**
     * Saves the high score to persistent storage if it's higher than the current one.
     * @param score The score achieved in the current run.
     */
    public void saveHighScore(int score) {
        int currentHighScore = getHighScore();
        if (score > currentHighScore) {
            sharedPreferences.edit()
                    .putInt(KEY_HIGH_SCORE, score)
                    .apply();
        }
    }

    /**
     * Retrieves the persisted high score.
     * @return The high score, or 0 if none is saved.
     */
    public int getHighScore() {
        return sharedPreferences.getInt(KEY_HIGH_SCORE, 0);
    }
}
