export default {
  async fetch(request, env) {
    let response = await env.ASSETS.fetch(request);
    const acceptsHtml = request.headers.get('accept')?.includes('text/html');
    if (response.status === 404 && acceptsHtml && ['GET', 'HEAD'].includes(request.method)) {
      const notFoundUrl = new URL(request.url);
      notFoundUrl.pathname = '/404.html';
      notFoundUrl.search = '';
      const notFound = await env.ASSETS.fetch(new Request(notFoundUrl, request));
      response = new Response(request.method === 'HEAD' ? null : notFound.body, {
        status: 404, headers: notFound.headers,
      });
    }
    const result = new Response(response.body, response);
    result.headers.set('X-Content-Type-Options', 'nosniff');
    result.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    result.headers.set('X-Frame-Options', 'SAMEORIGIN');
    if (result.headers.get('content-type')?.includes('text/html')) {
      result.headers.set('Cache-Control', 'no-cache');
    }
    return result;
  },
};
