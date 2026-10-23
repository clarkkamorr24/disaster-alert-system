import { TriangleAlert } from "lucide-react";
import { headers } from "next/headers";

import { CopyButton } from "@/components/settings/copy-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOfficer } from "@/lib/auth/dal";
import { DEFAULT_SENDER_ID, getEnv } from "@/lib/env";
import { getSmsGateway, isTestMode } from "@/lib/sms";

/** Builds `<origin>/api/webhooks/unisms` from the request headers. */
async function getWebhookUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto")?.split(",")[0].trim() ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}/api/webhooks/unisms`;
}

/** The SMS section of `/settings`. Awaits the credit balance and headers, so render it inside `<Suspense>`. */
export async function SmsCard() {
  await requireOfficer();
  const { UNISMS_SENDER_ID: senderId } = getEnv();
  const [balance, webhookUrl] = await Promise.all([getSmsGateway().getCreditBalance(), getWebhookUrl()]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="text-lg font-semibold">SMS</h2>
        </CardTitle>
        <CardDescription>How this system sends text messages through UniSMS.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[auto_1fr]">
          <dt className="text-sm text-muted-foreground">Driver</dt>
          <dd className="font-medium">{isTestMode() ? "Fake (test mode)" : "UniSMS (live)"}</dd>

          <dt className="text-sm text-muted-foreground">Sender ID</dt>
          <dd className="font-medium">{senderId}</dd>

          <dt className="text-sm text-muted-foreground">Credit balance</dt>
          <dd className="font-medium">
            {balance === null ? (
              <span className="text-muted-foreground">Balance unavailable</span>
            ) : (
              `${balance.toLocaleString("en-PH")} credits`
            )}
          </dd>
        </dl>

        {senderId === DEFAULT_SENDER_ID && (
          <div
            role="note"
            className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>Default sender ID cannot reach Smart, TNT, or Sun numbers and cannot send links.</p>
          </div>
        )}

        <section aria-labelledby="webhook-heading" className="flex flex-col gap-2">
          <h3 id="webhook-heading" className="font-medium">
            Webhook URL
          </h3>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 rounded-md border bg-muted px-3 py-2.5 text-sm break-all">
              {webhookUrl}
            </code>
            <CopyButton value={webhookUrl} label="Webhook URL" />
          </div>
          <p className="text-sm text-muted-foreground">
            In the UniSMS dashboard → Webhooks, paste this URL and copy the Webhook Secret Key into
            UNISMS_WEBHOOK_SECRET.
          </p>
        </section>
      </CardContent>
    </Card>
  );
}
