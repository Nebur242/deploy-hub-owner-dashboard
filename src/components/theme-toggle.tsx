"use client";
import { useTheme } from "@/hooks/theme-context";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="rounded-full p-2 hover:bg-gray-100 hover:text-white dark:hover:bg-gray-800 dark:hover:text-white cursor-pointer"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
        >
            {theme === "light" ? (
                <Moon className="size-5" />
            ) : (
                <Sun className="size-5" />
            )}
        </button>
    );
}
