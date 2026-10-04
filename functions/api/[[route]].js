import { fail } from "../../server/core.js";
import * as api from "../../server/handlers.js";

// Every /api/* request lands here and is handed to the matching handler.
export async function onRequest(context) {
  const { request, params, env } = context;
  const parts = (Array.isArray(params.route) ? params.route : [params.route]).filter(Boolean);
  const path = parts.join("/");
  const method = request.method;

  try {
    if (!env.DB) return fail(503, "not_configured");
    if (method === "GET" && path === "auth/login") return await api.login(context);
    if (method === "GET" && path === "auth/callback") return await api.callback(context);
    if (method === "GET" && path === "auth/dev-login") return await api.devLogin(context);
    if (method === "POST" && path === "auth/logout") return await api.logout(context);
    if (method === "GET" && path === "me") return await api.me(context);
    if (method === "PUT" && path === "profile") return await api.saveProfile(context);
    if (method === "GET" && parts[0] === "profiles" && parts.length === 2) {
      return await api.publicProfile(context, parts[1]);
    }
    if ((method === "GET" || method === "POST") && parts[0] === "views" && parts.length === 2) {
      return await api.views(context, parts[1]);
    }
    if ((method === "GET" || method === "POST") && path === "invites") return await api.invites(context);
    if (method === "POST" && path === "upload") return await api.upload(context);
    return fail(404, "not_found");
  } catch (error) {
    console.error("api error", method, path, error);
    return fail(500, "server_error");
  }
}
