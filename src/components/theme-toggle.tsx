"use client"

import { Button } from "@/components/ui/button"
import { useTheme } from "./theme-context"
import { Moon, Sun } from "lucide-react"

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button variant="ghost" size="sm" onClick={toggleTheme} className="w-9 px-0 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
      {theme === 'light' ? (
        <Moon className="h-4 w-4 text-slate-600" />
      ) : (
        <Sun className="h-4 w-4 text-primary" />
      )}
      <span className="sr-only">Cambiar tema</span>
    </Button>
  );
}
