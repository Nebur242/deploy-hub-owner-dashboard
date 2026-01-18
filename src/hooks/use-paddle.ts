import { useCallback, useEffect, useRef } from "react";
import { CheckoutResponse } from "@/common/types/subscription";

// Paddle types
declare global {
  interface Window {
    Paddle?: {
      Environment: {
        set: (env: "sandbox" | "production") => void;
      };
      Initialize: (options: { token: string }) => void;
      Checkout: {
        open: (options: PaddleCheckoutOptions) => void;
      };
    };
  }
}

interface PaddleCheckoutOptions {
  settings?: {
    displayMode?: "overlay" | "inline";
    theme?: "light" | "dark";
    locale?: string;
    successUrl?: string;
  };
  items?: Array<{ priceId: string; quantity?: number }>;
  customer?: { id: string } | { email: string };
  customData?: Record<string, string>;
}

interface UsePaddleOptions {
  onCheckoutSuccess?: () => void;
  onCheckoutClose?: () => void;
  onCheckoutError?: (error: Error) => void;
}

/**
 * Hook to manage Paddle.js integration
 */
export function usePaddle(options: UsePaddleOptions = {}) {
  const { onCheckoutSuccess, onCheckoutClose, onCheckoutError } = options;
  const isInitializedRef = useRef(false);
  const currentEnvironmentRef = useRef<string | null>(null);

  // Load Paddle.js script
  const loadPaddleScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      if (window.Paddle) {
        resolve();
        return;
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector(
        'script[src*="paddle.com"]',
      );
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve());
        existingScript.addEventListener("error", () =>
          reject(new Error("Failed to load Paddle script")),
        );
        return;
      }

      // Create and load script
      const script = document.createElement("script");
      script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Paddle script"));
      document.head.appendChild(script);
    });
  }, []);

  // Initialize Paddle with client token
  const initializePaddle = useCallback(
    async (clientToken: string, environment: string) => {
      try {
        await loadPaddleScript();

        if (!window.Paddle) {
          throw new Error("Paddle script loaded but Paddle object not found");
        }

        // Only re-initialize if environment changed or not initialized
        if (
          isInitializedRef.current &&
          currentEnvironmentRef.current === environment
        ) {
          return;
        }

        // Set environment (sandbox or production)
        const paddleEnv =
          environment === "production" ? "production" : "sandbox";
        window.Paddle.Environment.set(paddleEnv);

        // Initialize with client token
        window.Paddle.Initialize({
          token: clientToken,
        });

        isInitializedRef.current = true;
        currentEnvironmentRef.current = environment;

        console.log(`Paddle initialized in ${paddleEnv} mode`);
      } catch (error) {
        console.error("Failed to initialize Paddle:", error);
        throw error;
      }
    },
    [loadPaddleScript],
  );

  // Open Paddle checkout overlay
  const openCheckout = useCallback(
    async (checkoutData: CheckoutResponse) => {
      if (!checkoutData.clientToken || !checkoutData.priceId) {
        onCheckoutError?.(
          new Error("Invalid checkout data: missing clientToken or priceId"),
        );
        return;
      }

      try {
        // Initialize Paddle with the provided token and environment
        await initializePaddle(
          checkoutData.clientToken,
          checkoutData.environment || "sandbox",
        );

        if (!window.Paddle) {
          throw new Error("Paddle not initialized");
        }

        // Open checkout overlay
        window.Paddle.Checkout.open({
          settings: {
            displayMode: "overlay",
            theme: "light",
            locale: "en",
            successUrl: checkoutData.successUrl,
          },
          items: [
            {
              priceId: checkoutData.priceId,
              quantity: 1,
            },
          ],
          customer: checkoutData.customerId
            ? { id: checkoutData.customerId }
            : undefined,
          customData: checkoutData.metadata,
        });
      } catch (error) {
        console.error("Failed to open Paddle checkout:", error);
        onCheckoutError?.(
          error instanceof Error ? error : new Error("Checkout failed"),
        );
      }
    },
    [initializePaddle, onCheckoutError],
  );

  // Setup event listeners
  useEffect(() => {
    const handleCheckoutComplete = () => {
      onCheckoutSuccess?.();
    };

    const handleCheckoutClose = () => {
      onCheckoutClose?.();
    };

    // Paddle emits events on window
    window.addEventListener(
      "paddle:checkout:complete",
      handleCheckoutComplete as EventListener,
    );
    window.addEventListener(
      "paddle:checkout:close",
      handleCheckoutClose as EventListener,
    );

    return () => {
      window.removeEventListener(
        "paddle:checkout:complete",
        handleCheckoutComplete as EventListener,
      );
      window.removeEventListener(
        "paddle:checkout:close",
        handleCheckoutClose as EventListener,
      );
    };
  }, [onCheckoutSuccess, onCheckoutClose]);

  return {
    openCheckout,
    initializePaddle,
    isInitialized: isInitializedRef.current,
  };
}

export default usePaddle;
