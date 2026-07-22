import type { CallbackPayload } from "@tria/analysis";

export async function sendCallback(
  url: string,
  secret: string,
  payload: CallbackPayload
): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(
      `Callback failed: ${res.status} ${await res.text()}`
    );
  }
}
