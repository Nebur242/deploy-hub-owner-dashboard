// src/services/authService.ts
import app from "@/config/firebase";
import { getAuth, getIdToken } from "firebase/auth";

interface TokenInfo {
  token: string;
  expiresAt: number; // Timestamp when token expires
}

// LocalStorage keys
const TOKEN_INFO_KEY = "firebase_auth_token_info";
const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes buffer before expiration

// Helper function to check if code is running in browser environment
const isBrowser = () => typeof window !== "undefined";

class AuthService {
  constructor() {
    // Only set up the listener in browser environment
    if (isBrowser()) {
      // Initialize token listener
      const auth = getAuth(app);
      auth.onIdTokenChanged(async (user) => {
        if (!user) {
          // Clear token from localStorage when user signs out
          this.clearTokenCache();
        }
      });
    }
  }

  /**
   * Get a valid Firebase ID token
   * - Returns cached token from localStorage if it's valid for at least 5 more minutes
   * - Otherwise requests a new token
   */
  async getToken(): Promise<string | null> {
    const auth = getAuth(app);
    const { currentUser } = auth;

    if (!currentUser) {
      return null;
    }

    const now = Date.now();
    const cachedTokenInfo = this.getTokenInfoFromStorage();

    // If we have a valid token that isn't expiring soon, use it
    if (
      cachedTokenInfo &&
      cachedTokenInfo.expiresAt > now + TOKEN_REFRESH_BUFFER
    ) {
      return cachedTokenInfo.token;
    }

    try {
      // Request a fresh token
      const token = await getIdToken(currentUser, true);

      // Parse token to get expiration time
      let expiresAt;
      try {
        const parts = token.split(".");
        if (parts.length !== 3) throw new Error("Invalid token format");
        const payload = JSON.parse(atob(parts[1]));
        if (!payload.exp) throw new Error("Token missing expiration");
        expiresAt = payload.exp * 1000; // Convert seconds to milliseconds
      } catch (error) {
        console.error("Error parsing token:", error);
        // Use a default expiration (15 minutes from now)
        expiresAt = Date.now() + 15 * 60 * 1000;
      }

      // Save token to localStorage
      this.saveTokenInfoToStorage({ token, expiresAt });

      return token;
    } catch (error) {
      console.error("Error getting auth token:", error);
      return null;
    }
  }

  /**
   * Save token info to localStorage
   */
  private saveTokenInfoToStorage(tokenInfo: TokenInfo): void {
    try {
      if (!isBrowser()) {
        return;
      }
      localStorage.setItem(TOKEN_INFO_KEY, JSON.stringify(tokenInfo));
    } catch (error) {
      console.error("Error saving token to localStorage:", error);
    }
  }

  /**
   * Get token info from localStorage
   */
  private getTokenInfoFromStorage(): TokenInfo | null {
    try {
      if (!isBrowser()) {
        return null;
      }
      const tokenInfoStr = localStorage.getItem(TOKEN_INFO_KEY);
      if (!tokenInfoStr) return null;

      return JSON.parse(tokenInfoStr) as TokenInfo;
    } catch (error) {
      console.error("Error reading token from localStorage:", error);
      return null;
    }
  }

  /**
   * Clear the cached token from localStorage
   */
  clearTokenCache(): void {
    try {
      if (!isBrowser()) {
        return;
      }
      localStorage.removeItem(TOKEN_INFO_KEY);
    } catch (error) {
      console.error("Error clearing token from localStorage:", error);
    }
  }

  /**
   * Manually set a token in the cache
   * This is useful after signing in with a custom token to ensure
   * the token is immediately available for subsequent API calls
   */
  setToken(token: string): void {
    try {
      // Parse token to get expiration time
      let expiresAt;
      try {
        const parts = token.split(".");
        if (parts.length !== 3) throw new Error("Invalid token format");
        const payload = JSON.parse(atob(parts[1]));
        if (!payload.exp) throw new Error("Token missing expiration");
        expiresAt = payload.exp * 1000; // Convert seconds to milliseconds
      } catch (error) {
        console.error("Error parsing token:", error);
        // Use a default expiration (15 minutes from now)
        expiresAt = Date.now() + 15 * 60 * 1000;
      }

      // Save token to localStorage
      this.saveTokenInfoToStorage({ token, expiresAt });
    } catch (error) {
      console.error("Error setting token:", error);
    }
  }
}

// Export as singleton instance
export const authService = new AuthService();
