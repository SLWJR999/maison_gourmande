"use client";

import { useFormStatus } from "react-dom";
import { Loader2, LogIn } from "lucide-react";

export function LoginSubmit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full py-3.5">
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Connexion…
        </>
      ) : (
        <>
          <LogIn className="h-4 w-4" />
          Se connecter
        </>
      )}
    </button>
  );
}
