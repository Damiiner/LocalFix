import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./passwordCrypto";

describe("passwordCrypto", () => {
  it("verifies correct password against stored hash", async () => {
    const stored = await hashPassword("correct horse 123");
    expect(await verifyPassword("correct horse 123", stored)).toBe(true);
    expect(await verifyPassword("wrong", stored)).toBe(false);
  });
});
