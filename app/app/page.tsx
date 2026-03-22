"use client";

import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { CryptoTab } from "@/components/dashboard/crypto/crypto-tab";

export default function DashboardPage() {
  return (
    <DashboardClient>
      <CryptoTab />
    </DashboardClient>
  );
}
