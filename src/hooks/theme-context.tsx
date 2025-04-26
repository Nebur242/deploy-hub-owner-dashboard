"use client";

import type React from "react";
import { createContext, useState, useContext, useEffect } from "react";
import { useGetUserQuery } from "@/store/features/users";
import { useAppSelector } from "@/store/hooks";

type Theme = "light" | "dark" | "system";

type ThemeContextType = {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [theme, setTheme] = useState<Theme>("system");
    const [isInitialized, setIsInitialized] = useState(false);
    const { infos: user } = useAppSelector((state) => state.auth);

    // Get user data using RTK Query if authenticated
    const { data: userData } = useGetUserQuery(user?.uid || '', {
        skip: !user?.uid
    });

    useEffect(() => {
        // First check if we have user preferences from the API
        if (userData?.preferences?.theme) {
            setTheme(userData.preferences.theme);
            setIsInitialized(true);
            return;
        }

        // If no user preferences, fall back to localStorage
        const savedTheme = localStorage.getItem("theme") as Theme | null;
        const initialTheme = savedTheme || "system";

        setTheme(initialTheme);
        setIsInitialized(true);
    }, [userData?.preferences?.theme]);

    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem("theme", theme);

            // Handle system preference
            if (theme === "system") {
                const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                if (systemPrefersDark) {
                    document.documentElement.classList.add("dark");
                } else {
                    document.documentElement.classList.remove("dark");
                }
            } else {
                // Handle explicit light/dark preference
                if (theme === "dark") {
                    document.documentElement.classList.add("dark");
                } else {
                    document.documentElement.classList.remove("dark");
                }
            }
        }
    }, [theme, isInitialized]);

    // Add a media query listener for system theme changes
    useEffect(() => {
        if (theme === "system") {
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

            const handleChange = (e: MediaQueryListEvent) => {
                if (e.matches) {
                    document.documentElement.classList.add("dark");
                } else {
                    document.documentElement.classList.remove("dark");
                }
            };

            mediaQuery.addEventListener("change", handleChange);

            return () => {
                mediaQuery.removeEventListener("change", handleChange);
            };
        }
    }, [theme]);

    const toggleTheme = () => {
        const nextTheme = theme === "light" ? "dark" : (theme === "dark" ? "system" : "light");
        setTheme(nextTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};
