import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BackHome() {
  const router = useRouter();
  const handleBackHome = () => {
    router.push("/");
  };
  return (
    <Button variant="outline" className="w-fit" onClick={handleBackHome}>
      <ArrowLeft className="mr-2" />
      Back Home
    </Button>
  );
}
