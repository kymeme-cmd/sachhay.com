import { describe, it, expect, vi } from "vitest";
import { trackRoutes } from "./track";


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
    expect(record.device).toBe("mobile");
    expect(typeof record.time).toBe("number");
    expect(record.ip).not.toBe("1.2.3.4"); // IP đã băm
    expect(record.meta.path).toBe("/books");
    vi.unstubAllGlobals();
  });
});
