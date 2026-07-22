"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader, PageShell } from "@/components/ui/page";
import { btnPrimaryClass, errorTextClass, fieldLabelClass, inputClass } from "@/components/ui/styles";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
      return;
    }
    router.push(searchParams.get("redirect") || "/issues");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="username" className={fieldLabelClass}>
          아이디
        </label>
        <input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={inputClass}
          autoFocus
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className={fieldLabelClass}>
          비밀번호
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </div>
      {error && <p className={errorTextClass}>{error}</p>}
      <button type="submit" className={`${btnPrimaryClass} self-start`}>
        로그인
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <PageShell width="narrow">
      <PageHeader title="로그인" description="관리자 계정으로 로그인하세요." />
      <Suspense>
        <LoginForm />
      </Suspense>
    </PageShell>
  );
}
