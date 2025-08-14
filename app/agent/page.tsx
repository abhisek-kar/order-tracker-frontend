"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AgentPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/agent/dashboard");
  }, [router]);

  return null;
}
