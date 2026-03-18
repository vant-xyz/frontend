import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/api";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { AccountClient } from "@/components/dashboard/account/account-client";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default async function AccountPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/");
  }

  let data;
  try {
    data = await getUserProfile(token);
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    // Handle error or redirect
    redirect("/");
  }

  return (
    <DashboardClient>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumb Header */}
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
                <BreadcrumbPage>Account</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Account Settings</h1>
            <p className="text-sm text-gray-500">Manage your profile, wallets, and preferences.</p>
          </div>
        </div>

        {/* Client-side Interaction */}
        <AccountClient initialData={data} token={token} />
      </div>
    </DashboardClient>
  );
}
