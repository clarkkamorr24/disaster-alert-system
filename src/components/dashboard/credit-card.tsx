import { FlaskConical } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireOfficer } from "@/lib/auth/dal";
import { getSmsGateway, isTestMode } from "@/lib/sms";

/** The UniSMS credit balance. Awaits the gateway, so render it inside `<Suspense>`. */
export async function CreditCard() {
  await requireOfficer();
  const balance = await getSmsGateway().getCreditBalance();

  return (
    <Card className="h-full">
      <CardHeader className="flex items-center justify-between gap-2">
        <CardTitle>
          <h2 className="text-lg font-semibold">
            SMS credits
          </h2>
        </CardTitle>
        {isTestMode() && (
          <Badge variant="secondary">
            <FlaskConical data-icon="inline-start" />
            Test mode
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {balance === null ? (
          <p className="text-lg font-medium text-muted-foreground">Balance unavailable</p>
        ) : (
          <p>
            <span className="text-3xl font-semibold tabular-nums">{balance.toLocaleString("en-PH")}</span>{" "}
            <span className="text-muted-foreground">credits</span>
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          1 credit per 160 characters, per member.{" "}
          <Link href="/settings" className="font-medium text-primary hover:underline">
            SMS settings
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

/** Placeholder while {@link CreditCard} loads. */
export function CreditCardSkeleton() {
  return <Skeleton className="h-36 rounded-xl" />;
}
