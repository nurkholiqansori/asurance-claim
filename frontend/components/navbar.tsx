"use client";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, FileText } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <nav className="border-b bg-white px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2 font-semibold text-lg">
        <FileText className="w-5 h-5 text-primary" />
        Approval System
      </div>
      {user && (
        <div className="flex items-center gap-4">
          <div className="text-sm text-right">
            <p className="font-medium">{user.name}</p>
            <p className="text-muted-foreground capitalize">{user.role}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </Button>
        </div>
      )}
    </nav>
  );
}
