"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export default function DashboardOrdersPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard");
  }, []);
  return null;
}
