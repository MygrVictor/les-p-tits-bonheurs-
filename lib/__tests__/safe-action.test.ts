import { describe, expect, it, vi } from "vitest";

const createSafeActionClientMock = vi.fn((config: any) => ({
  __config: config,
}));

vi.mock("next-safe-action", () => ({
  createSafeActionClient: createSafeActionClientMock,
}));

describe("safe-action", () => {
  it("initializes action client with a french generic error", async () => {
    const { actionClient } = await import("../safe-action");
    expect(actionClient).toBeDefined();
    expect(createSafeActionClientMock).toHaveBeenCalledTimes(1);

    const callArg = createSafeActionClientMock.mock.calls[0][0];
    expect(callArg.handleServerError()).toContain("Une erreur est survenue");
  });
});
