import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to login page - webapp is authenticated-only
  redirect("/login");
}
