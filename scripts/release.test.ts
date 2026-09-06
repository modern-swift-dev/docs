import assert from "node:assert/strict";
import { test } from "node:test";
import { releaseFor } from "./release.ts";

test("release metadata and tag fallback", async (t) => {
  const requests: string[] = [];
  let responses: Response[] = [];
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    requests.push(String(input));
    const response = responses.shift();
    assert.ok(response, "Unexpected API request");
    return response;
  });
  const json = (data: unknown, status = 200) => Response.json(data, { status });

  responses = [json({ tag_name: "v1.2.3", published_at: "2026-09-06T12:00:00Z", html_url: "https://github.com/example/release", body: "Release notes" })];
  assert.deepEqual(await releaseFor("example"), {
    version: "1.2.3", releaseDate: "September 6, 2026", releaseURL: "https://github.com/example/release", releaseNotes: "Release notes",
  });
  assert.equal(requests.length, 1);

  const firstPage = Array.from({ length: 100 }, () => ({ name: "2.9.0" }));
  firstPage[0] = { name: "v3.1.0" };
  responses = [json({}, 404), json(firstPage), json([{ name: "3.10.0" }, { name: "4.0.0-beta.1" }, { name: "03.20.0" }, { name: "unrelated" }])];
  assert.deepEqual(await releaseFor("example"), {
    version: "3.10.0", releaseDate: "via Git tag", releaseURL: "https://github.com/modern-swift-dev/example/tree/3.10.0", releaseNotes: "No GitHub release notes are available for this tag.",
  });
  assert.match(requests.at(-1) ?? "", /page=2$/);

  responses = [json({}, 404), json([{ name: "v3.1.0" }])];
  assert.equal((await releaseFor("example")).version, "3.1.0");

  responses = [json({}, 404), json([{ name: "4.0.0-rc.1" }])];
  await assert.rejects(releaseFor("example"), /No stable version tags/);
  responses = [json({}, 404), json([{ name: 123 }])];
  await assert.rejects(releaseFor("example"), /Invalid tag data/);
  responses = [json({}, 404), json({}, 403)];
  await assert.rejects(releaseFor("example"), /Tag lookup.*HTTP 403/);
  for (const status of [403, 429, 500]) {
    responses = [json({}, status)];
    await assert.rejects(releaseFor("example"), new RegExp(`Release lookup.*HTTP ${status}`));
    assert.equal(responses.length, 0);
  }
});
