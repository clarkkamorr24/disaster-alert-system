import { AccountMenuDropdown } from "@/components/app-shell/account-menu-dropdown";
import { requireOfficer } from "@/lib/auth/dal";

function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? words[0][0] + words[words.length - 1][0] : name.slice(0, 1);
  return letters.toUpperCase() || "O";
}

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
