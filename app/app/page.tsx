"use client";

import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default function DashboardPage() {
  return (
    <DashboardClient>
      <div className="flex items-center justify-center h-full text-gray-500">
        Dashboard content will appear here
      </div>
    </DashboardClient>
  );
}
