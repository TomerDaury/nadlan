"use server";

import { z } from "zod";
import { createClient } from "@/lib/integrations/supabase/server";

export type LoginState = { error?: string; email?: string; signedIn?: boolean };

const credentialsSchema = z.object({
  email: z.email({ error: "יש להזין כתובת מייל תקינה" }),
  password: z.string().min(1, "יש להזין סיסמה"),
});

// Email + password sign-in (ADR-9). The agent account is created manually in
// Supabase; public sign-up is disabled. After sign-in the agent list is checked again.
export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const parsed = credentialsSchema.safeParse({ email, password: String(formData.get("password") ?? "") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.status === 429 || /rate.?limit/i.test(`${error.code ?? ""} ${error.message}`)) {
      return { error: "יותר מדי ניסיונות כניסה. נסו שוב בעוד כמה דקות.", email };
    }
    if (error.code === "invalid_credentials" || error.status === 400) {
      return { error: "המייל או הסיסמה שגויים", email };
    }
    return { error: "ההתחברות נכשלה. נסו שוב.", email };
  }

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    await supabase.auth.signOut();
    return { error: "אין לך הרשאת גישה לממשק הניהול", email };
  }

  // No server redirect here: the page rendered in the same response did not always see the
  // new session cookies, so the agent landed back on the login form. The form does a full
  // page load instead, which always sends the fresh cookies.
  return { signedIn: true };
}
