import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TEMPLATE_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../prompts/analyze-issue.md"
);

export async function buildPrompt(title: string, body: string): Promise<string> {
  const template = await fs.readFile(TEMPLATE_PATH, "utf-8");
  return template.replace("{{title}}", title).replace("{{body}}", body);
}
