import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTransactions } from "@/lib/api";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { HistoryClient } from "@/components/dashboard/history/history-client";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default async function HistoryPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/");
  }

  let data;
  try {
    data = await getTransactions(token);
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    redirect("/");
  }

  return (
    <DashboardClient>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col gap-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/app">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>History</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Transaction History</h1>
            <p className="text-sm text-gray-500">View and verify your on-chain activities.</p>
          </div>
        </div>

        <HistoryClient initialTransactions={data.transactions} />
      </div>
    </DashboardClient>
  );
}
