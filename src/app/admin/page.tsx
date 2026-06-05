import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import AdminPanel from "@/components/AdminPanel"

export default async function AdminPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  return <AdminPanel />
}
