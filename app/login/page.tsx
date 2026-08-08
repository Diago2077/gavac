"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { signIn, signUp, type AuthState } from "./actions";

const initialState: AuthState = { error: null };

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signInState, signInAction, signInPending] = useActionState(
    signIn,
    initialState,
  );
  const [signUpState, signUpAction, signUpPending] = useActionState(
    signUp,
    initialState,
  );
  const [signedUp, setSignedUp] = useState(false);
  const signUpAttempted = useRef(false);

  useEffect(() => {
    if (
      signUpAttempted.current &&
      !signUpPending &&
      signUpState.error === null
    ) {
      setSignedUp(true);
    }
  }, [signUpState, signUpPending]);

  const state = mode === "signin" ? signInState : signUpState;
  const pending = mode === "signin" ? signInPending : signUpPending;

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-emerald-800">GAVAC</h1>
          <p className="text-sm text-neutral-600">
            Sistema de conteo de garrapatas
          </p>
        </div>

        <div className="flex rounded-lg border border-neutral-300 p-1 text-sm">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setSignedUp(false);
            }}
            className={`flex-1 rounded-md py-2 font-medium transition-colors ${
              mode === "signin"
                ? "bg-emerald-700 text-white"
                : "text-neutral-600"
            }`}
          >
            Ingresar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setSignedUp(false);
            }}
            className={`flex-1 rounded-md py-2 font-medium transition-colors ${
              mode === "signup"
                ? "bg-emerald-700 text-white"
                : "text-neutral-600"
            }`}
          >
            Crear cuenta
          </button>
        </div>

        {signedUp ? (
          <div className="rounded-md bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
            Cuenta creada. Revisá tu email para confirmar (si la confirmación
            está habilitada) y luego ingresá.
          </div>
        ) : (
          <form
            action={mode === "signin" ? signInAction : signUpAction}
            onSubmit={() => {
              if (mode === "signup") {
                signUpAttempted.current = true;
                setSignedUp(false);
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                required
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {state.error && (
              <p className="text-sm text-red-600">{state.error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-md bg-emerald-700 px-4 py-2.5 font-medium text-white transition-colors hover:bg-emerald-800 disabled:opacity-60"
            >
              {pending
                ? "Procesando..."
                : mode === "signin"
                  ? "Ingresar"
                  : "Crear cuenta"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
