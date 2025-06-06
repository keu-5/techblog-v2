"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const ThemeToggle = ({ children }: { children: React.ReactNode }) => {
  const { setTheme } = useTheme();

  return (
    <>
      {children}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="
              fixed bottom-8 right-8 
              dark:text-gray-800 text-gray-200
              hover:dark:text-gray-700 hover:text-gray-200
              dark:bg-white bg-black
              hover:dark:bg-gray-100 hover:bg-gray-950
              dark:border-white border-black
            "
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="
            dark:text-gray-800 text-gray-200
            hover:dark:text-gray-700 hover:text-gray-200
            dark:bg-white bg-black
            hover:dark:bg-gray-100 hover:bg-gray-950
            border-none
          "
        >
          <DropdownMenuItem
            className="dark:hover:bg-gray-300 dark:hover:text-black"
            onClick={() => setTheme("light")}
          >
            Light
          </DropdownMenuItem>
          <DropdownMenuItem
            className="dark:hover:bg-gray-300 dark:hover:text-black"
            onClick={() => setTheme("dark")}
          >
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem
            className="dark:hover:bg-gray-300 dark:hover:text-black"
            onClick={() => setTheme("system")}
          >
            System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
