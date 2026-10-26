import { isAuthed } from "@/lib/auth";
import AlertLog from "./components/AlertLog";
import Login from "./components/Login";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ loi?: string }> }) {
  if (await isAuthed()) return <AlertLog />;
  const { loi } = await searchParams;
  return <Login initialError={loi ? "Sai mật khẩu." : ""} />;
}
