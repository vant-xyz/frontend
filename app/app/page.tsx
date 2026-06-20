"use client"

import { AppShell } from "@/components/dashboard/app-shell"
import { WorldCupTab } from "@/components/dashboard/predict/world-cup-tab"

export default function DashboardPage() {
  return (
    <AppShell>
      <WorldCupTab />
    </AppShell>
  );
}
