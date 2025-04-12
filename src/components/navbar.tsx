"use client";

import Link from "next/link";
import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { Menu, X, Moon, Sun, Home, BarChart3, Settings, Github } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { setTheme, theme } = useTheme();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const navItems = [
    { name: "Home", href: "/home", icon: <Home className="h-4 w-4 mr-2" /> },
    { name: "Dashboard", href: "/dashboard", icon: <BarChart3 className="h-4 w-4 mr-2" /> },
    { name: "GitHub", href: "/home", icon: <Github className="h-4 w-4 mr-2" /> },
    { name: "Settings", href: "/settings", icon: <Settings className="h-4 w-4 mr-2" /> },
  ];

  return (
    <nav className="bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/home" className="text-2xl font-bold text-primary">
                BombasticTool
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-foreground/70 hover:text-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme} 
                className="rounded-full"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
          <div className="flex md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-foreground hover:text-primary hover:bg-background focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-foreground/70 hover:text-foreground flex items-center px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-border">
            <div className="flex items-center justify-between px-5">
              <UserButton afterSignOutUrl="/" />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme} 
                className="rounded-full"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 