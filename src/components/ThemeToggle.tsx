"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center justify-between px-2 py-1.5">
        <span className="text-sm font-medium">Theme</span>
        <div className="flex items-center rounded-md border p-1">
             <Button
                variant={theme === 'light' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTheme("light")}
                className="h-auto px-2 py-0.5"
            >
                <Sun className="h-4 w-4" />
            </Button>
            <Button
                variant={theme === 'dark' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTheme("dark")}
                className="h-auto px-2 py-0.5"
            >
                <Moon className="h-4 w-4" />
            </Button>
        </div>
    </div>
  )
}
