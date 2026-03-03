"use client";

import React from "react";
import { usePathname } from "next/navigation";

export const Footer = () => {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/register") return null;

  return (
    <footer className="bg-blue-800 mt-auto">
      <div className="w-full mx-auto max-w-screen-xl p-4 md:flex md:items-center md:justify-between">
        <span className="text-sm text-gray-200 sm:text-center">
          © {new Date().getFullYear()} Performance Evaluation System.
        </span>
      </div>
    </footer>
  );
};
