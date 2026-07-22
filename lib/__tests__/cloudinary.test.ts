import { beforeEach, describe, expect, it, vi } from "vitest";

const configMock = vi.fn();

vi.mock("cloudinary", () => ({
  v2: {
    config: configMock,
  },
}));

describe("getCloudinaryClient", () => {
  beforeEach(() => {
    vi.resetModules();
    configMock.mockReset();
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
  });

  it("throws with explicit missing env vars", async () => {
    const { getCloudinaryClient } = await import("../cloudinary");
    expect(() => getCloudinaryClient()).toThrow(
      /Configuration Cloudinary manquante/,
    );
  });

  it("configures cloudinary once and returns same client", async () => {
    process.env.CLOUDINARY_CLOUD_NAME = "cloud";
    process.env.CLOUDINARY_API_KEY = "key";
    process.env.CLOUDINARY_API_SECRET = "secret";

    const { getCloudinaryClient } = await import("../cloudinary");
    const first = getCloudinaryClient();
    const second = getCloudinaryClient();

    expect(first).toBe(second);
    expect(configMock).toHaveBeenCalledTimes(1);
    expect(configMock).toHaveBeenCalledWith({
      cloud_name: "cloud",
      api_key: "key",
      api_secret: "secret",
      secure: true,
    });
  });
});
