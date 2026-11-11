import { describe, it, expect, vi } from "vitest";
import { trackRoutes, detectDevice } from "./track";

describe("detectDevice", () => {
  const cases: Array<[string, string, number?]> = [
    ["Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36", "android"],
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1", "iphone"],
    ["Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1", "ipad"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15", "ipad", 5],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36", "macos"],
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36", "windows"],
    ["Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36", "linux"],
    ["Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36", "chromeos"],
    ["curl/8.4.0", "other"],
  ];
  it.each(cases)("%s → %s", (ua, expected, touch) => {
    expect(detectDevice(ua, touch ?? 0)).toBe(expected);
  });
});


describe("POST /track", () => {
  it("gửi bản ghi lên stream với id = tên nhóm", async () => {
    const sent: unknown[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
      sent.push(...JSON.parse(String(init.body)));
      return new Response('{"success":true}', { status: 200 });
    }));

    const env = { STREAM_URL: "https://stream.test", TRACK_GROUP: "nhóm 13", JWT_SECRET: "s" };
    const res = await trackRoutes.request(
      "/",
      {
        method: "POST",
        headers: { "User-Agent": "Mozilla/5.0 (iPhone) Mobile", "CF-Connecting-IP": "1.2.3.4" },
        body: JSON.stringify({ path: "/books", referrer: "", session_id: "abc" }),
      },
      env
    );
    await new Promise((r) => setTimeout(r, 0)); // chờ fetch chạy nền

    expect(res.status).toBe(204);
    expect(sent).toHaveLength(1);
    const record = sent[0] as Record<string, any>;
    console.log("Bản ghi gửi lên stream:", JSON.stringify(record, null, 2));
    expect(record.id).toBe("nhóm 13");
    expect(record.device).toBe("iphone");
    expect(record.meta.device_type).toBe("mobile");
    expect(typeof record.time).toBe("number");
    expect(record.ip).toBe("1.2.3.4"); // IP thật, không băm
    expect(record.meta.path).toBe("/books");
    vi.unstubAllGlobals();
  });
});
