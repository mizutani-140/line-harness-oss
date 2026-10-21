import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const calls = vi.hoisted(() => ({
  createServer: vi.fn(),
  createTransport: vi.fn(),
  connect: vi.fn(async () => {}),
  registerTools: vi.fn(),
  registerResources: vi.fn(),
}));

vi.mock("@modelcontextprotocol/sdk/server/mcp.js", () => ({
  McpServer: class {
    constructor() { calls.createServer(); }
    connect = calls.connect;
  },
}));
vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
  StdioServerTransport: class {
    constructor() { calls.createTransport(); }
  },
}));
vi.mock("../src/tools/index.js", () => ({ registerAllTools: calls.registerTools }));
vi.mock("../src/resources/index.js", () => ({ registerAllResources: calls.registerResources }));

const originalVersion = Object.getOwnPropertyDescriptor(process.versions, "node")!;

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  Object.defineProperty(process.versions, "node", originalVersion);
  vi.restoreAllMocks();
});

describe("MCP startup runtime boundary", () => {
  it.each(["22.23.3", "24.22.0", "26.12.0"])(
    "rejects %s before server construction and connection",
    async (version) => {
      Object.defineProperty(process.versions, "node", { value: version });
      await import("../src/index.js");
      await vi.waitFor(() => expect(process.exit).toHaveBeenCalledWith(1));
      expect(calls.createServer).not.toHaveBeenCalled();
      expect(calls.createTransport).not.toHaveBeenCalled();
      expect(calls.registerTools).not.toHaveBeenCalled();
      expect(calls.registerResources).not.toHaveBeenCalled();
      expect(calls.connect).not.toHaveBeenCalled();
    },
  );

  it.each(["22.23.4", "24.22.1", "26.12.1"])(
    "preserves MCP startup on %s",
    async (version) => {
      Object.defineProperty(process.versions, "node", { value: version });
      await import("../src/index.js");
      await vi.waitFor(() => expect(calls.connect).toHaveBeenCalledOnce());
      expect(calls.createServer).toHaveBeenCalledOnce();
      expect(calls.createTransport).toHaveBeenCalledOnce();
      expect(calls.registerTools).toHaveBeenCalledOnce();
      expect(calls.registerResources).toHaveBeenCalledOnce();
      expect(process.exit).not.toHaveBeenCalled();
    },
  );
});
