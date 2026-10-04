import { mediaContentType } from "../../server/handlers.js";

const KEY_PATTERN = /^[0-9a-f-]{36}\/[0-9a-f]{24}\.[a-z0-9]{2,4}$/;

// GET /media/<user id>/<random>.<ext>: uploaded files from R2. They are served
// with a fixed type and a sandbox policy, so an upload can never run as a page.
export async function onRequestGet({ request, env, params }) {
  const key = (Array.isArray(params.path) ? params.path : [params.path]).join("/");
  const contentType = mediaContentType(key);
  if (!env.MEDIA || !KEY_PATTERN.test(key) || !contentType) return new Response("Not found", { status: 404 });

  const object = await env.MEDIA.get(key, { range: request.headers });
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers({
    "content-type": contentType,
    "cache-control": "public, max-age=31536000, immutable",
    "x-content-type-options": "nosniff",
    "content-security-policy": "default-src 'none'; sandbox",
    "accept-ranges": "bytes",
    etag: object.httpEtag,
  });

  // Range support lets audio and video seek.
  if (request.headers.has("range") && object.range) {
    const offset = object.range.offset ?? Math.max(object.size - (object.range.suffix ?? 0), 0);
    const length = object.range.length ?? object.size - offset;
    headers.set("content-range", `bytes ${offset}-${offset + length - 1}/${object.size}`);
    headers.set("content-length", String(length));
    return new Response(object.body, { status: 206, headers });
  }
  headers.set("content-length", String(object.size));
  return new Response(object.body, { headers });
}
