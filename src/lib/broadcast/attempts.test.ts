import { describe, expect, it } from "vitest";

import { collectChain, countAttempts } from "./attempts";

const at = (minute: number) => new Date(Date.UTC(2026, 9, 24, 8, minute));

// A (original) → B (resend of A) → C (resend of B).
const PARENT_OF = new Map<string, string | null>([
  ["A", null],
  ["B", "A"],
  ["C", "B"],
]);
const CHILDREN_OF = new Map([
  ["A", ["B"]],
  ["B", ["C"]],
]);
const CREATED_AT = new Map([
  ["A", at(0)],
  ["B", at(10)],
  ["C", at(20)],
]);
const PHONES = new Map([
  ["A", ["+639170000001", "+639170000002"]],
  ["B", ["+639170000001"]],
  ["C", ["+639170000001", "+639170000003"]],
]);

describe("collectChain", () => {
  it("includes the original and every resend up to the last one", () => {
    expect(collectChain("C", PARENT_OF, CHILDREN_OF, CREATED_AT)).toEqual(["A", "B", "C"]);
  });

  it("leaves out resends created later", () => {
    expect(collectChain("B", PARENT_OF, CHILDREN_OF, CREATED_AT)).toEqual(["A", "B"]);
  });

  it("is just the broadcast when it has no resends", () => {
    expect(collectChain("X", new Map([["X", null]]), new Map(), new Map([["X", at(0)]]))).toEqual(["X"]);
  });

  it("stops at a loop instead of running forever", () => {
    const loop = new Map<string, string | null>([
      ["A", "B"],
      ["B", "A"],
    ]);
    // B was created after A, so only A is in A's chain.
    expect(collectChain("A", loop, new Map([["B", ["A"]], ["A", ["B"]]]), CREATED_AT)).toEqual(["A"]);
  });
});

describe("countAttempts", () => {
  it("counts each broadcast of the chain that included the phone", () => {
    const attempts = countAttempts(PHONES, ["A", "B", "C"]);
    expect(attempts.get("+639170000001")).toBe(3);
    expect(attempts.get("+639170000003")).toBe(1);
    expect(attempts.get("+639170000002")).toBe(1);
  });

  it("ignores broadcasts outside the chain", () => {
    expect(countAttempts(PHONES, ["A", "B"]).get("+639170000003")).toBeUndefined();
  });

  it("gives 1 to every phone of a broadcast without resends", () => {
    expect([...countAttempts(PHONES, ["A"]).values()]).toEqual([1, 1]);
  });
});
