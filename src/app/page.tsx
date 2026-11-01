import { redirect } from "next/navigation";

// Redirect-only route: nothing to validate for instant navigation.
export const instant = false;

export default function Home() {
  redirect("/dashboard");
}
