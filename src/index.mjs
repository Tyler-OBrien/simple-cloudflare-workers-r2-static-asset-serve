export default {
  /**
   * Respond with content from R2 Bucket
   * @param {Request} request
   */
  async fetch(request, env) {
    // This is just for GET Requests, static content, etca
    if (request.method == 'GET') {
      let { pathname } = new URL(request.url)
      // If the pathname ends with /, look for index.html
      if (pathname.endsWith('/')) {
        pathname += 'index.html'
      }
      // Slice off the leading '/'
      pathname = pathname.slice(1)

      const file = await env.R2_BUCKET.get(pathname)
      if (file === undefined || file === null) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Object Not Found',
          }),
          {
            status: 404,
            headers: {
              'content-type': 'application/json',
            },
          },
        )
      }
      // We want to return the stream directly instead of using something like awaiting file.arrayBuffer so we stop getting charged for our Worker being active.
      return new Response(file.body)
    }
    // For any other http method, we just return a 404
    return new Response(null, { status: 404 })
  },
}
