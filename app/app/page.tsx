"use client"

import { DashboardClient } from "@/components/dashboard/dashboard-client"
import { WorldCupTab } from "@/components/dashboard/predict/world-cup-tab"

export default function DashboardPage() {
  return (
    <DashboardClient>
      <WorldCupTab />
    </DashboardClient>
  );
}
