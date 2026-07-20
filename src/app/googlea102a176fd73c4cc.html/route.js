export async function GET() {
  return new Response('google-site-verification: googlea102a176fd73c4cc.html', {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
