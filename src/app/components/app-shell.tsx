"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import AppSidebar from "./app-sidebar";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthenticationPage =
    pathname === "/login" || pathname === "/cadastro";

  if (isAuthenticationPage) {
    return children;
  }

  return (
    <>
      <AppSidebar />
      <div className="min-h-screen lg:pl-60">{children}</div>
    </>
  );
}
