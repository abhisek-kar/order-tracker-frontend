import { RefreshCw } from "lucide-react";
import React from "react";

export default function PageLoader() {
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <RefreshCw
        strokeWidth={1.5}
        size={40}
        className=" rounded-full animate-spin "
      />
    </div>
  );
}
