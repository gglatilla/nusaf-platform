"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Calculator,
  FileSpreadsheet,
  Users,
  Settings,
  LogOut,
  ClipboardList,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui";

interface NavProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

const navItems = [
  { href: "/internal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/internal/products", label: "Products", icon: Package },
  { href: "/internal/pricing", label: "Pricing", icon: Calculator },
  { href: "/internal/price-lists", label: "Price Lists", icon: FileSpreadsheet },
  { href: "/internal/quotes", label: "Quotes", icon: ClipboardList },
  { href: "/internal/customers", label: "Customers", icon: Users },
  { href: "/internal/job-cards", label: "Job Cards", icon: Truck },
  { href: "/internal/settings", label: "Settings", icon: Settings },
];

export function InternalNav({ user }: NavProps) {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/internal" className="text-xl font-bold text-gray-900">
              NUSAF
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/internal" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{user.name}</span>
              <span className="mx-1">·</span>
              <span className="text-gray-400">{user.role}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
