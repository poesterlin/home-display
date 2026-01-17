import type { RouteParams } from "./$types";

export interface RequestHandler {
  (event: {
    request: Request;
    params: RouteParams;
    url: URL;
    getClientAddress(): () => string;
    platform: Readonly<App.Platform>;
    locals: App.Locals;
  }): Response | Promise<Response>;
}