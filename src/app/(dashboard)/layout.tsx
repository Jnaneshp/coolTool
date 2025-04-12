"use client";

import { Navbar } from "@/components/navbar";
import { useAuth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Only check auth on the client side once mounted
  if (mounted && isLoaded && !isSignedIn) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
} 