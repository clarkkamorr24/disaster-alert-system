import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireOfficer } from "@/lib/auth/dal";

/** The Account section of `/settings`. Reads the officer, so render it inside `<Suspense>`. */
export async function AccountCard() {
  const officer = await requireOfficer();

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="text-lg font-semibold">Account</h2>
        </CardTitle>
        <CardDescription>The one officer account used to sign in to this system.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <section aria-labelledby="profile-heading" className="flex flex-col gap-4">
          <h3 id="profile-heading" className="font-medium">
            Profile
          </h3>
          {/* Keyed so a saved edit re-mounts the form with the new values. */}
          <ProfileForm key={`${officer.name}|${officer.email}`} name={officer.name} email={officer.email} />
        </section>

        <Separator />

        <section aria-labelledby="password-heading" className="flex flex-col gap-4">
          <h3 id="password-heading" className="font-medium">
            Change password
          </h3>
          <ChangePasswordForm />
        </section>
      </CardContent>
    </Card>
  );
}
