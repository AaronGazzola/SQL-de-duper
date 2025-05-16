// app/regex-patterns/page.tsx
"use client";

import PatternForm from "@/components/PatternForm";
import PatternList from "@/components/PatternList";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";

export default function RegexPatternsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-start gap-3">
        <SidebarTrigger className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </SidebarTrigger>
        <h1 className="text-2xl font-bold mb-6">SQL Regex Patterns</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PatternForm />
        <PatternList />
      </div>
    </div>
  );
}
