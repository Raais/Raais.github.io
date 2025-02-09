import { Hono } from 'hono'
import { cors } from 'hono/cors';

export type Vars = {
  // Custom Env Variables in .vars
  ENVIRONMENT: string;
};

export type HonoType = {
  Variables: {
    // Custom Context Variables added by middlewares
  };
  Bindings: {
    KV: KVNamespace; // Cloudflare KV
  } & Vars;
};

const app = new Hono<HonoType>();

const CANVAS_KEY = 'canvas:canvas';
const ALLOWED_CLIENTS = [
  'https://raais.github.io',
  'https://raa.is'
];

app.use(
  cors({
    origin: ALLOWED_CLIENTS,
  })
);

app.post('/sync', async (c) => {
  const origin = c.req.header("Origin");
  if (!origin) return c.json({ result: 'error' }, 400);

  const key = c.req.header('x-notsosecret-key');

  if (!key || parseInt(key) !== new Date().getMonth()) {
    return c.json({ result: 'error' }, 400);
  }

  const formData = await c.req.formData();
  const image = formData.get('image') as File;

  if (!image) {
    return c.json({ result: 'error' }, 400);
  }

  const buf = await image.arrayBuffer();
  await c.env.KV.put(CANVAS_KEY, buf);

  return c.json({ result: 'ok' }, 200);
});

app.get('/sync', async (c) => {
  const origin = c.req.header("Origin");
  if (!origin) return c.json({ result: 'error' }, 400);

  const key = c.req.header('x-notsosecret-key');

  if (!key || parseInt(key) !== new Date().getMonth()) {
    return c.json({ result: 'error' }, 400);
  }

  const canvas = await c.env.KV.get(CANVAS_KEY, 'arrayBuffer');
  if (!canvas) {
    return c.json({ result: 'error' }, 400);
  }
  return new Response(canvas, {
    headers: {
      'Content-Type': 'image/png',
    },
    status: 200,
  });
});

export default app;