import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createUniSmsGateway, mapUniSmsMessage } from "@/lib/sms/unisms";
import { SmsGatewayError } from "@/types/sms";

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

const request = {
  recipients: ["+639171234567"],
  content: "hi",
  senderId: "Unisoft",
  metadata: { broadcastId: "b1" },
};

describe("createUniSmsGateway", () => {
  const gw = createUniSmsGateway("sk_test");

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("blast", () => {
    it("posts the request with Basic auth", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ blast_id: "b_1", queued: 1, skipped: [] }));

      await gw.blast(request);

      expect(fetchMock).toHaveBeenCalledWith(
        "https://unismsapi.com/api/blast",
        expect.objectContaining({
          method: "POST",
          cache: "no-store",
          headers: expect.objectContaining({ Authorization: "Basic " + btoa("sk_test:") }),
        }),
      );
      expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
        recipients: ["+639171234567"],
        content: "hi",
        sender_id: "Unisoft",
        metadata: { broadcastId: "b1" },
      });
    });

    it("maps a 200 response with skipped numbers", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          blast_id: "b_1",
          queued: 1,
          skipped: [{ index: 1, errors: "invalid", recipient: "+639990000000" }],
        }),
      );

      expect(await gw.blast(request)).toEqual({
        kind: "ok",
        blastId: "b_1",
        queued: 1,
        skipped: [{ recipient: "+639990000000", reason: "invalid" }],
      });
    });

    it("flattens field errors into a readable skip reason", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          blast_id: "b_1",
          queued: 0,
          skipped: [
            { index: 0, recipient: "09181234567", errors: { recipient: ["This Sender ID can't send to Smart."] } },
          ],
        }),
      );

      const result = await gw.blast(request);
      expect(result).toMatchObject({
        kind: "ok",
        skipped: [{ recipient: "09181234567", reason: "This Sender ID can't send to Smart." }],
      });
    });

    it("sends JSON headers and a timeout signal", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ blast_id: "b_1", queued: 1, skipped: [] }));

      await gw.blast(request);

      const init = fetchMock.mock.calls[0][1];
      expect(init?.headers).toMatchObject({ "Content-Type": "application/json", Accept: "application/json" });
      expect(init?.signal).toBeInstanceOf(AbortSignal);
    });

    it("returns network_error for an unreadable 200 response, since messages may be queued", async () => {
      fetchMock.mockResolvedValue(new Response("<html>oops</html>", { status: 200 }));

      expect(await gw.blast(request)).toEqual({
        kind: "network_error",
        message: "UniSMS sent an unexpected response.",
      });
    });

    it("returns rate_limited with the retry header", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ errors: "Too many requests." }, { status: 429, headers: { "x-retry-after-ms": "1500" } }),
      );

      expect(await gw.blast(request)).toEqual({ kind: "rate_limited", retryAfterMs: 1500 });
    });

    it("defaults the retry wait to 2 seconds", async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 429 }));

      expect(await gw.blast(request)).toEqual({ kind: "rate_limited", retryAfterMs: 2000 });
    });

    it("returns rejected for other errors", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ errors: "All messages skipped." }, { status: 422 }));

      expect(await gw.blast(request)).toEqual({
        kind: "rejected",
        status: 422,
        message: "All messages skipped.",
      });
    });

    it("flattens field errors in a rejection", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ errors: { content: ["Content is too long."], sender_id: ["Unknown sender ID."] } }, { status: 422 }),
      );

      expect(await gw.blast(request)).toEqual({
        kind: "rejected",
        status: 422,
        message: "Content is too long. Unknown sender ID.",
      });
    });

    it("falls back to the status text when the error body is empty", async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 401, statusText: "Unauthorized" }));

      expect(await gw.blast(request)).toEqual({ kind: "rejected", status: 401, message: "Unauthorized" });
    });

    it("falls back to the status code when there is no status text", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ errors: null }, { status: 500, statusText: "" }));

      expect(await gw.blast(request)).toEqual({ kind: "rejected", status: 500, message: "UniSMS returned 500." });
    });

    it("returns network_error when fetch throws", async () => {
      fetchMock.mockRejectedValue(new TypeError("fetch failed"));

      expect(await gw.blast(request)).toEqual({ kind: "network_error", message: "fetch failed" });
    });
  });

  describe("getBlastMessages", () => {
    it("maps the messages of a blast", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          messages: [
            {
              reference_id: "msg_1",
              recipient: "09171234567",
              status: "failed",
              fail_reason: "Network error",
              metadata: { broadcastId: "b1" },
              content: "hi",
              created: "2026-10-23T00:00:00Z",
            },
          ],
          total: 1,
        }),
      );

      expect(await gw.getBlastMessages("b_1")).toEqual([
        {
          referenceId: "msg_1",
          recipient: "09171234567",
          status: "failed",
          failReason: "Network error",
          metadata: { broadcastId: "b1" },
        },
      ]);
      expect(fetchMock).toHaveBeenCalledWith("https://unismsapi.com/api/blast/b_1", expect.anything());
    });

    it("throws SmsGatewayError on a non-2xx response", async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 404 }));

      await expect(gw.getBlastMessages("b_1")).rejects.toBeInstanceOf(SmsGatewayError);
    });

    it("throws SmsGatewayError when fetch throws", async () => {
      fetchMock.mockRejectedValue(new TypeError("fetch failed"));

      await expect(gw.getBlastMessages("b_1")).rejects.toBeInstanceOf(SmsGatewayError);
    });

    it("throws SmsGatewayError when the body has no messages", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ total: 0 }));

      await expect(gw.getBlastMessages("b_1")).rejects.toBeInstanceOf(SmsGatewayError);
    });
  });

  describe("getCreditBalance", () => {
    it("returns the SMS credits", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ status: "active", sid_tokens: 0, sms_credits: 420 }));

      expect(await gw.getCreditBalance()).toBe(420);
      expect(fetchMock).toHaveBeenCalledWith("https://unismsapi.com/api/account", expect.anything());
    });

    it("returns null on a 401", async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 401 }));

      expect(await gw.getCreditBalance()).toBeNull();
    });

    it("returns null when fetch throws", async () => {
      fetchMock.mockRejectedValue(new TypeError("fetch failed"));

      expect(await gw.getCreditBalance()).toBeNull();
    });

    it("returns null when the credits are missing", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ status: "active" }));

      expect(await gw.getCreditBalance()).toBeNull();
    });
  });
});

describe("mapUniSmsMessage", () => {
  it("treats missing fail_reason and metadata as null", () => {
    expect(mapUniSmsMessage({ reference_id: "msg_1", recipient: "+639171234567", status: "sent" })).toEqual({
      referenceId: "msg_1",
      recipient: "+639171234567",
      status: "sent",
      failReason: null,
      metadata: null,
    });
  });

  it("treats non-object metadata such as [] as null", () => {
    expect(
      mapUniSmsMessage({ reference_id: "msg_1", recipient: "+639171234567", status: "sent", metadata: [] }).metadata,
    ).toBeNull();
  });

  it("maps an unknown status to pending", () => {
    expect(mapUniSmsMessage({ reference_id: "msg_1", recipient: "+639171234567", status: "queued" }).status).toBe(
      "pending",
    );
  });

  it("throws SmsGatewayError for a malformed message", () => {
    expect(() => mapUniSmsMessage({ status: "sent" })).toThrow(SmsGatewayError);
  });
});
