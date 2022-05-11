export default {
  /**
   * Respond with content from R2 Bucket
   * @param {Request} request
   */
  async fetch(request, env, ctx) {
    // This is just for GET Requests, static content, etca
    if (request.method == "GET") {
      let { pathname } = new URL(request.url);
      // If the pathname ends with /, look for index.html
      if (pathname.endsWith("/")) {
        pathname += "index.html";
      }
      // Slice off the leading '/'
      pathname = pathname.slice(1);

      // try matching from cache first
      const cache = caches.default;
      let response = await cache.match(request);
      if (!response) {
        // no cache match, try reading from R2
        // we shouldn't need to try/catch here, but R2 seems to throw internal errrors right now when querying for a file that doesn't exist
        const file = await env.R2_BUCKET.get(pathname);

        if (file === undefined || file === null) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Object Not Found",
            }),
            {
              status: 404,
              headers: {
                "content-type": "application/json",
              },
            }
          );
        }

        response = new Response(file.body, {
          headers: {
            "cache-control": "public, max-age=604800",
            "content-type": file.httpMetadata?.contentType,
            etag: file.httpEtag,
          },
        });

        // store in cache asynchronously, so to not hold up the request
        ctx.waitUntil(cache.put(request, response.clone()));
      }
      // return uploaded image, etc.
      return response;
    }
    // For any other http method, we just return a 404
    return new Response(null, { status: 404 });
  },
};
