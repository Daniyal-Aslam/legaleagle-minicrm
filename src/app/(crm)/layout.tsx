import { redirect } from "next/navigation";
import { SessionProvider } from "@/components/auth/session-provider";
import { AppShell } from "@/components/layout/app-shell";
import { getSessionUser } from "@/lib/auth/server";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  // Middleware already redirects signed-out visitors; this is the authoritative check.
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <SessionProvider user={user}>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
