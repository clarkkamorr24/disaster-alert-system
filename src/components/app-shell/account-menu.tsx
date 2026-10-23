import { AccountMenuDropdown } from "@/components/app-shell/account-menu-dropdown";
import { OfficerChipMenu } from "@/components/app-shell/officer-chip-menu";
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

/** Header chip for the signed-in officer. Reads the session, so render it inside `<Suspense>`. */
export async function OfficerChip() {
  const officer = await requireOfficer();

  return (
    <OfficerChipMenu name={officer.name} email={officer.email} initials={initialsOf(officer.name)} />
  );
}
