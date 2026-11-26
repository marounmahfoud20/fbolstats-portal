"use client";

import { useState, useTransition, type FormEvent, type ReactNode, type Ref } from "react";

export default function MembershipSaveForm({ action, className, children, ref }: {
  action: (formData: FormData) => Promise<{ error: string } | void>;
  className?: string;
  children: ReactNode;
  ref?: Ref<HTMLFormElement>;
}) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    setError("");
    startTransition(async () => {
      const result = await action(data);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form ref={ref} className={className} onSubmit={submit}>
      {error && <p role="alert" className="mb-3 rounded border border-red-300 bg-red-50 p-2 text-red-800">{error}</p>}
      {pending && <p role="status" className="mb-2">Saving…</p>}
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
    </form>
  );
}
