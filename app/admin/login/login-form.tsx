"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signIn, type LoginState } from "@/app/admin/login/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initialState);
  const signedIn = state.signedIn === true;

  // Full page load (not a client-side transition), so the new session cookies are always sent.
  useEffect(() => {
    if (signedIn) window.location.replace("/admin/properties");
  }, [signedIn]);

  return (
    <form action={action} className="flex flex-col gap-4 text-start">
      {state.error && (
        <p role="alert" className="rounded-input bg-error/10 px-4 py-2.5 text-small text-error">
          {state.error}
        </p>
      )}

      <Field id="email" label="כתובת מייל">
        {(control) => (
          <Input
            {...control}
            name="email"
            type="email"
            dir="ltr"
            autoComplete="username"
            placeholder="name@example.com"
            defaultValue={state.email}
          />
        )}
      </Field>

      <Field id="password" label="סיסמה">
        {(control) => <Input {...control} name="password" type="password" dir="ltr" autoComplete="current-password" />}
      </Field>

      <Button type="submit" className="mt-2 w-full" disabled={pending || signedIn}>
        {pending || signedIn ? "מתחבר..." : "כניסה"}
      </Button>
    </form>
  );
}
