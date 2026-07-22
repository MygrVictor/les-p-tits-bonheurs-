import { describe, expect, it } from "vitest";
import { authConfig } from "../auth.config";

describe("authConfig", () => {
  it("has expected session settings", () => {
    expect(authConfig.session?.strategy).toBe("jwt");
    expect(authConfig.trustHost).toBe(true);
    expect(authConfig.pages?.signIn).toBe("/compte");
  });

  it("jwt callback assigns ADMIN role and preserves name", async () => {
    const token = await authConfig.callbacks!.jwt!({
      token: {},
      user: { role: "ADMIN", name: "Pauline" } as any,
    } as any);

    expect(token.role).toBe("ADMIN");
    expect(token.name).toBe("Pauline");
  });

  it("jwt callback defaults to CLIENT when no ADMIN role", async () => {
    const token = await authConfig.callbacks!.jwt!({
      token: {},
      user: { role: "CLIENT" } as any,
    } as any);

    expect(token.role).toBe("CLIENT");
  });

  it("session callback maps role/id/name from token", async () => {
    const session = await authConfig.callbacks!.session!({
      session: { user: {} },
      token: { role: "ADMIN", sub: "user_1", name: "Nina" },
    } as any);

    expect(session.user.role).toBe("ADMIN");
    expect((session.user as any).id).toBe("user_1");
    expect(session.user.name).toBe("Nina");
  });
});
