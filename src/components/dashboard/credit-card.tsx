import { CreditCard } from "lucide-react";

import { StatCard } from "@/components/layout/stat-card";
import { requireOfficer } from "@/lib/auth/dal";
import { getSmsGateway, isTestMode } from "@/lib/sms";

function creditHint(balance: number | null) {
  if (isTestMode()) return "Test mode";
  return balance === null ? "Balance unavailable" : "SMS credits remaining";
}

/** The UniSMS credit balance as the fourth stat card. Awaits the gateway, so render it inside `<Suspense>`. */
export async function CreditStatCard() {
  await requireOfficer();
  const balance = await getSmsGateway().getCreditBalance();

  return (
    <StatCard
      label="Credits available"
      value={balance === null ? "—" : balance.toLocaleString("en-US")}
      hint={creditHint(balance)}
      icon={CreditCard}
      tone="advisory"
    />
  );
}
