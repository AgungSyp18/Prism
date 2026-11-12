"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  HandHelping,
  RotateCcw,
  History,
  Users,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

interface NavbarProps {
  user: {
    id: string;
    username: string;
    name: string;
    role: "ADMIN" | "STAFF";
  };
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Logout failed:", e);
      setLoggingOut(false);
    }
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/items", label: "Inventaris Barang", icon: Boxes },
    { href: "/borrow", label: "Peminjaman", icon: HandHelping },
    { href: "/returns", label: "Pengembalian", icon: RotateCcw },
    { href: "/transactions", label: "Riwayat", icon: History },
  ];

  if (user.role === "ADMIN") {
    navLinks.push({ href: "/users", label: "Kelola Pengguna", icon: Users });
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              LAB
            </div>
            <div>
              <span className="font-bold text-slate-800 text-lg leading-tight block">
                Lab Inventory
              </span>
              <span className="text-xs text-slate-500 hidden sm:block">
                Management System
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const isAdminTab = item.href === "/users";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? isAdminTab
                        ? "bg-purple-50 text-purple-700 shadow-sm font-semibold"
                        : "bg-blue-50 text-blue-700 shadow-sm font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? isAdminTab
                          ? "text-purple-600"
                          : "text-blue-600"
                        : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right side: User profile & Logout */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="flex items-center space-x-2.5 pl-3 border-l border-slate-200">
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-800 leading-none">
                  {user.name}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center justify-end space-x-1.5">
                  <span className="font-mono">@{user.username}</span>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                      user.role === "ADMIN"
                        ? "bg-purple-100 text-purple-700 border border-purple-200"
                        : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {user.role === "ADMIN" ? (
                      <ShieldCheck className="w-3 h-3 mr-0.5" />
                    ) : (
                      <UserCheck className="w-3 h-3 mr-0.5" />
                    )}
                    {user.role}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Keluar / Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                user.role === "ADMIN"
                  ? "bg-purple-100 text-purple-700 border border-purple-200"
                  : "bg-emerald-100 text-emerald-700 border border-emerald-200"
              }`}
            >
              {user.role === "ADMIN" ? (
                <ShieldCheck className="w-3 h-3 mr-0.5" />
              ) : (
                <UserCheck className="w-3 h-3 mr-0.5" />
              )}
              {user.role}
            </span>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-4 space-y-1">
          <div className="py-2.5 px-3 bg-slate-50 rounded-xl mb-3 flex items-center justify-between border border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-800">{user.name}</p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">@{user.username}</p>
            </div>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                user.role === "ADMIN"
                  ? "bg-purple-100 text-purple-700 border border-purple-200"
                  : "bg-emerald-100 text-emerald-700 border border-emerald-200"
              }`}
            >
              {user.role === "ADMIN" ? (
                <ShieldCheck className="w-3 h-3 mr-0.5" />
              ) : (
                <UserCheck className="w-3 h-3 mr-0.5" />
              )}
              {user.role}
            </span>
          </div>

          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const isAdminTab = item.href === "/users";

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-base font-medium transition ${
                  isActive
                    ? isAdminTab
                      ? "bg-purple-50 text-purple-700 font-semibold"
                      : "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive
                      ? isAdminTab
                        ? "text-purple-600"
                        : "text-blue-600"
                      : "text-slate-400"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full mt-2 flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-50"
          >
            <LogOut className="w-5 h-5" />
            <span>{loggingOut ? "Memproses Keluar..." : "Keluar Sistem"}</span>
          </button>
        </div>
      )}
    </header>
  );
}
