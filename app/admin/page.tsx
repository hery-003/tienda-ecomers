import { Suspense } from "react";
import type { Metadata } from "next";
import { isAuthed } from "@/lib/auth";
import AdminPanel from "@/components/AdminPanel";

export const metadata: Metadata = {
  title: "Panel de Administración",
  robots: { index: false, follow: false }
};

export default function AdminPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "#ab9b8d" }}>Cargando panel…</div>}>
      <AdminGate />
    </Suspense>
  );
}

async function AdminGate() {
  const authed = await isAuthed();
  return <AdminPanel initialAuthed={authed} />;
}
