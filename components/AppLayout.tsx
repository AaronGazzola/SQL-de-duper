"use client";
import AppLoader from "@/components/AppLoader";
import Sidebar from "@/components/Sidebar";

import { SidebarProvider } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  if (!isMounted) return <AppLoader />;
  return (
    <SidebarProvider>
      <Sidebar />
      <main className="flex-1 overflow-auto flex flex-col items-center">
        {children}
      </main>
      <Toaster
        toastOptions={{
          style: {
            background: "transparent",
            border: "none",
            padding: 0,
            boxShadow: "none",
            justifyContent: "end",
          },
        }}
      />
    </SidebarProvider>
  );
}
