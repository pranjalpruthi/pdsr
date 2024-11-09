"use client";

import Navbar from "@/components/wrapper/navbar";
import Footer from "@/components/wrapper/footer";

interface PageWrapperProps {
  children: React.ReactNode;
}

export function PageWrapper({ children }: PageWrapperProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="absolute z-[-99] pointer-events-none inset-0 flex items-center justify-center bg-gradient-to-b from-background to-muted/20 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        {children}
      </main>
      <Footer />
    </div>
  );
}