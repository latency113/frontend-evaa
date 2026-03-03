"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

export const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (pathname === "/login" || pathname === "/register") return null;

  const handleLogout = () => {
    logout();
    router.push("/login"); // safe push
  };

  return (
    <nav className="bg-blue-800 border-gray-200">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <Link href="/home" className="flex items-center">
          <span className="self-center text-2xl font-semibold text-white whitespace-nowrap">
            Performance System
          </span>
        </Link>
        <div className="flex items-center gap-4">
          {isAuthenticated() && user ? (
            <div className="flex items-center gap-4">
              <span className="text-white font-medium text-sm">
                {user.name} ({user.role})
              </span>
              <button
                onClick={handleLogout}
                className="text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2"
              >
                ออกจากระบบ
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link href="/login" className="text-blue-800 bg-white hover:bg-gray-100 font-medium rounded-lg text-sm px-4 py-2">
                เข้าสู่ระบบ
              </Link>
              <Link href="/register" className="text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-sm px-4 py-2">
                ลงทะเบียน
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
