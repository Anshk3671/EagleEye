// ============================================================
// useTheme.tsx — Dark/Light Mode Management
//
// Provides a global theme system to the entire app using React Context.
// The selected theme is saved in localStorage so it persists across page reloads.
// It also adds/removes the "dark" CSS class on <html> to enable Tailwind dark mode.
//
// How to use in any component:
//   const { theme, toggleTheme } = useTheme();
// ============================================================

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// Type: only "dark" or "light" are valid theme values
type Theme = "dark" | "light";

// Shape of data available through the theme context
interface ThemeContextType {
    theme: Theme;         // Current theme: "dark" or "light"
    toggleTheme: () => void; // Function to switch between dark and light
}

// Create a React Context — this allows any child component to access theme state
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ThemeProvider: Wrap this around the entire app in App.tsx so all components can use theme
export function ThemeProvider({ children }: { children: ReactNode }) {

    // Initialize theme from localStorage (so user's preference is remembered after refresh)
    // Default is "dark" if no preference is stored
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("eagleeye-theme") as Theme;
            return stored || "dark"; // Use stored value or default to dark mode
        }
        return "dark";
    });

    // Whenever theme changes: update the <html> class and save to localStorage
    useEffect(() => {
        const root = document.documentElement; // The <html> element
        if (theme === "dark") {
            root.classList.add("dark");    // Adds "dark" class → enables Tailwind dark: styles
        } else {
            root.classList.remove("dark"); // Removes "dark" class → switches to light mode
        }
        // Persist theme preference in browser storage
        localStorage.setItem("eagleeye-theme", theme);
    }, [theme]);

    // toggleTheme: switches between dark ↔ light
    const toggleTheme = () => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    };

    return (
        // Provide theme and toggleTheme to all child components
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

// useTheme: Custom hook — call this in any component to get theme state
export function useTheme() {
    const context = useContext(ThemeContext);
    // Throw error if useTheme is called outside ThemeProvider (prevents silent bugs)
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
