"use client";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    if (user.role === "user") router.replace("/dashboard/claims");
    if (user.role === "verifier") router.replace("/dashboard/verify");
    if (user.role === "approver") router.replace("/dashboard/approve");
  }, [user]);

  return null;
}
