const HOP = new Set([
  'connection','keep-alive','proxy-authenticate','proxy-authorization',
  'te','trailer','transfer-encoding','upgrade','host','content-length','accept-encoding'
]);

async function handleProxy(request, seg) {
  const reqUrl = new URL(request.url);
  const region = (reqUrl.searchParams.get('region') || 'eu').toLowerCase();
  reqUrl.searchParams.delete('region');

  const restPath = seg ? `/${seg}` : '';
  const upstream = new URL(`https://px1.tuya${region}.com/homeassistant${restPath}`);
  reqUrl.searchParams.forEach((v, k) => upstream.searchParams.append(k, v));

  const method = request.method.toUpperCase();

  const headers = new Headers();
  request.headers.forEach((v, k) => { if (!HOP.has(k.toLowerCase())) headers.set(k, v); });

  const init = { method, headers };
  if (!['GET','HEAD'].includes(method)) init.body = request.body;

  const upstreamResp = await fetch(upstream.toString(), init);
  const respHeaders = new Headers(upstreamResp.headers);
  respHeaders.set('Access-Control-Allow-Origin', '*');
  respHeaders.append('Vary', 'Origin');

  return new Response(upstreamResp.body, { status: upstreamResp.status, headers: respHeaders });
}

export async function onRequest(context) {
  return handleProxy(context.request, context.params.path);
}

export async function onRequestPost(context) {
  return handleProxy(context.request, context.params.path);
}

export async function onRequestOptions(context) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Headers', context.request.headers.get('access-control-request-headers') || '*');
  headers.set('Access-Control-Allow-Methods', context.request.headers.get('access-control-request-method') || '*');
  headers.set('Access-Control-Max-Age', '86400');
  headers.append('Vary', 'Origin');
  return new Response(null, { status: 204, headers });
}

