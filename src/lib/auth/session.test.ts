import { describe, expect, it } from "vitest";
import { SESSION_MAX_AGE, createSessionToken, verifySessionToken } from "./session";

describe("session tokens", () => {
  it("round-trips a valid token", async () => {
    const token = await createSessionToken("usr_mariam");
    expect(await verifySessionToken(token)).toBe("usr_mariam");
  });

  it("rejects tampered tokens", async () => {
    const token = await createSessionToken("usr_mariam");
    const [body, sig] = token.split(".");
    const forgedBody = Buffer.from(JSON.stringify({ sub: "usr_yousef", exp: 9_999_999_999 })).toString("base64url");
    expect(await verifySessionToken(`${forgedBody}.${sig}`)).toBeNull();
    expect(await verifySessionToken(`${body}.${sig.slice(0, -2)}xx`)).toBeNull();
    expect(await verifySessionToken("garbage")).toBeNull();
    expect(await verifySessionToken(undefined)).toBeNull();
  });

  it("expires after the session lifetime", async () => {
    const issued = Date.now();
    const token = await createSessionToken("usr_mariam", issued);
    expect(await verifySessionToken(token, issued + (SESSION_MAX_AGE + 1) * 1000)).toBeNull();
  });
});
