import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let nombre: string | null = null;
  if (user) {
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("nombre")
      .eq("id", user.id)
      .maybeSingle();
    nombre = perfil?.nombre ?? null;
  }

  return (
    <AppShell userEmail={user?.email ?? null} userNombre={nombre}>
      {children}
    </AppShell>
  );
}
