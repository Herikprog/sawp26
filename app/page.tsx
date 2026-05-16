import { redirect } from "next/navigation";

export default async function HomePage() {
  // Bypassing Supabase check for local preview
  redirect("/login");
}
