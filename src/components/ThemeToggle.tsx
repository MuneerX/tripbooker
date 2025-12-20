
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="p-2">
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        <Button
          variant={theme === 'light' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setTheme("light")}
          className="h-auto px-2 py-1.5 text-sm"
          aria-label="Switch to light theme"
        >
          <Sun className="mr-2 h-4 w-4" />
          Light
        </Button>
        <Button
          variant={theme === 'dark' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setTheme("dark")}
          className="h-auto px-2 py-1.5 text-sm"
          aria-label="Switch to dark theme"
        >
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </Button>
      </div>
    </div>
  )
}
