import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import NavBar from "@/components/nav-bar";

export default async function ChildrenLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/pin");

  return (
    <div className="min-h-screen pb-20">
      {children}
      <NavBar />
    </div>
  );
}
