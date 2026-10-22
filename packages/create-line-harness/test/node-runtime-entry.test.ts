import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const calls = vi.hoisted(() => ({
  ensureRepo: vi.fn(async () => "/fixture"),
  runSetup: vi.fn(async () => {}),
  runUpdate: vi.fn(async () => {}),
  mkdirSync: vi.fn(),
}));

vi.mock("../src/steps/clone-repo.js", () => ({ ensureRepo: calls.ensureRepo }));
vi.mock("../src/commands/setup.js", () => ({ runSetup: calls.runSetup }));
vi.mock("../src/commands/update.js", () => ({ runUpdate: calls.runUpdate }));
vi.mock("node:fs", async (importOriginal) => ({
  ...await importOriginal<typeof import("node:fs")>(),
  existsSync: () => false,
  mkdirSync: calls.mkdirSync,
}));

const originalVersion = Object.getOwnPropertyDescriptor(process.versions, "node")!;
const originalArgv = process.argv;

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  Object.defineProperty(process.versions, "node", originalVersion);
  process.argv = originalArgv;
  vi.restoreAllMocks();
});

describe("installer runtime boundary", () => {
  for (const command of ["setup", "update"]) {
    it.each(["22.23.3", "24.22.0", "26.12.0"])(
      `rejects %s before ${command} side effects`,
      async (version) => {
        Object.defineProperty(process.versions, "node", { value: version });
        process.argv = ["node", "index.js", command];
        await import("../src/index.js");
        await vi.waitFor(() => expect(process.exit).toHaveBeenCalledWith(1));
        expect(calls.ensureRepo).not.toHaveBeenCalled();
        expect(calls.runSetup).not.toHaveBeenCalled();
        expect(calls.runUpdate).not.toHaveBeenCalled();
        expect(calls.mkdirSync).not.toHaveBeenCalled();
      },
    );
  }

  it.each(["22.23.4", "24.22.1", "26.12.1"])(
    "preserves direct update without a repo or npx check on %s",
    async (version) => {
      Object.defineProperty(process.versions, "node", { value: version });
      process.argv = ["node", "index.js", "update", "--repo-dir", "/fixture"];
      await import("../src/index.js");
      await vi.waitFor(() => expect(calls.runUpdate).toHaveBeenCalledWith("/fixture", { repairAdmin: false }));
      expect(calls.ensureRepo).not.toHaveBeenCalled();
      expect(process.exit).not.toHaveBeenCalled();
    },
  );

  it("preserves setup on a patched runtime", async () => {
    Object.defineProperty(process.versions, "node", { value: "22.23.4" });
    process.argv = ["node", "index.js", "setup", "--repo-dir", "/fixture"];
    await import("../src/index.js");
    await vi.waitFor(() => expect(calls.runSetup).toHaveBeenCalledWith("/fixture", { fromSource: false }));
    expect(calls.ensureRepo).toHaveBeenCalledWith("/fixture");
    expect(process.exit).not.toHaveBeenCalled();
  });
});
