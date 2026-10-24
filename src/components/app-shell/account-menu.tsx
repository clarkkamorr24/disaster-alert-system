import { AccountMenuDropdown } from "@/components/app-shell/account-menu-dropdown";
import { requireOfficer } from "@/lib/auth/dal";
import { initialsOf } from "@/lib/initials";

/** Sidebar footer for the signed-in officer. Reads the session, so render it inside `<Suspense>`. */
export async function AccountMenu() {
  const officer = await requireOfficer();

  return (
    <AccountMenuDropdown
      name={officer.name}
      email={officer.email}
      initials={initialsOf(officer.name)}
    />
  );
}
