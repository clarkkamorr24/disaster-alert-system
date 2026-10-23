import { describe, expect, it } from "vitest";

import { broadcastTitle } from "./title";

const PREFIX = "Mi-isi FA:";

describe("broadcastTitle", () => {
  it("uses the alert title over the content", () => {
    expect(
      broadcastTitle({
        alertTitle: "Mayon raised to Alert Level 3",
        content: "Mi-isi FA: Bulkang Mayon - Alert Level 3",
        prefix: PREFIX,
      }),
    ).toBe("Mayon raised to Alert Level 3");
  });

  it("removes the prefix and cuts a long announcement at 40 characters", () => {
    expect(
      broadcastTitle({
        alertTitle: null,
        content: "Mi-isi FA: Monthly safety drill reminder for all members",
        prefix: PREFIX,
      }),
    ).toBe("Monthly safety drill reminder for all me…");
  });

  it("returns a short announcement whole", () => {
    expect(
      broadcastTitle({ alertTitle: null, content: "Mi-isi FA: Meeting on Friday", prefix: PREFIX }),
    ).toBe("Meeting on Friday");
  });
});
