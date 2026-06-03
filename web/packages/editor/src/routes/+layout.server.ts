import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

const PUBLIC_PATHS = ['/login', '/register', '/terms', '/api/firmware', '/api/stripe/webhook'];

export const load: LayoutServerLoad = async (event) => {
  const path = event.url.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

  if (!isPublic && !event.locals.user) {
    redirect(302, '/login?redirect=' + encodeURIComponent(path + event.url.search));
  }

  return {
    user: event.locals.user,
  };
};
