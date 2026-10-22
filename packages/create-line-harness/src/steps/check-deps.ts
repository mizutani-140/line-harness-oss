import * as p from "@clack/prompts";
import { execa } from "execa";
import { supportsNodeVersion } from "../../../../scripts/node-runtime.mjs";
export { supportsNodeVersion } from "../../../../scripts/node-runtime.mjs";

export async function checkDeps(): Promise<void> {
  const s = p.spinner();
  s.start("環境チェック中...");

  // Check Node.js version
  const nodeVersion = process.versions.node;
  if (!supportsNodeVersion(nodeVersion)) {
    s.stop("環境チェック失敗");
    p.cancel(`Node.js 22.23.4 / 24.22.1 / 26.12.1 以降の各対応系列が必要です（現在: ${nodeVersion}）`);
    process.exit(1);
  }

  // Check that npx is available (wrangler will be invoked via npx)
  try {
    await execa("npx", ["--version"]);
  } catch {
    s.stop("環境チェック失敗");
    p.cancel("npx が見つかりません。Node.js をインストールしてください。");
    process.exit(1);
  }

  s.stop("環境チェック完了");
}
