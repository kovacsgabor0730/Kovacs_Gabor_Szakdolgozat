/**
 * Type definitions for Expo Constants module.
 * This module extends the expo-constants types to include custom configuration values.
 */
declare module 'expo-constants' {
  /**
   * Extended Constants interface that includes application configuration.
   */
  export interface Constants {
    /**
     * Configuration object from app.config.js/app.json that is available at runtime.
     */
    expoConfig: {
      /**
       * Extra configuration values defined in the app config.
       */
      extra: {
        /**
         * Base URL of the backend API service.
         */
        apiUrl: string;
        // További extra mezők itt
      };
    };
  }
}

export {}