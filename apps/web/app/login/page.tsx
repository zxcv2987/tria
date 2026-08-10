"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader, PageShell } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  cardClass,
  errorTextClass,
  fieldLabelClass,
  mutedTextClass,
} from "@/components/ui/styles";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setError(null);
    setSubmitting(true);
    try {
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
    } catch {
      setError("로그인 요청에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`${cardClass} flex w-full max-w-sm flex-col gap-5`}
      aria-busy={submitting}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="username" className={fieldLabelClass}>
          아이디
        </label>
        <Input
          id="username"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoFocus
          required
          disabled={submitting}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className={fieldLabelClass}>
          비밀번호
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          disabled={submitting}
        />
      </div>
      {error ? (
        <p className={errorTextClass} role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "로그인 중..." : "로그인"}
      </Button>
    </form>
  );
}

function LoginFormFallback() {
  return (
    <div className={`${cardClass} flex w-full max-w-sm flex-col gap-5`}>
      <p className={mutedTextClass}>로그인 폼을 불러오는 중...</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <PageShell width="narrow">
      <PageHeader
        title="로그인"
        description="관리자 계정으로 로그인하세요."
      />
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </PageShell>
  );
}
