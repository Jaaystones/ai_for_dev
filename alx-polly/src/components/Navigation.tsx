"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="border-b bg-white/95 backdrop-blur-md dark:bg-slate-900/95 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="group flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 group-hover:from-blue-700 group-hover:to-purple-700 transition-all duration-300">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Polly
            </span>
          </Link>
          
          <div className="flex gap-2">
            <Link href="/polls">
              <Button 
                variant={isActive("/polls") ? "default" : "ghost"}
                className={`text-sm font-medium transition-all duration-300 ${
                  isActive("/polls") 
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg" 
                    : "hover:bg-blue-50 dark:hover:bg-slate-800"
                }`}
              >
                📊 View Polls
              </Button>
            </Link>
            <Link href="/create-poll">
              <Button 
                variant={isActive("/create-poll") ? "default" : "ghost"}
                className={`text-sm font-medium transition-all duration-300 ${
                  isActive("/create-poll") 
                    ? "bg-gradient-to-r from-purple-600 to-purple-700 shadow-lg" 
                    : "hover:bg-purple-50 dark:hover:bg-slate-800"
                }`}
              >
                ✨ Create Poll
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
