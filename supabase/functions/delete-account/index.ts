// Supabase Edge Function: deletes the calling user's account (and their habits
// via the FK on-delete-cascade). Runs with the service role, but only ever
// deletes the user identified by their own JWT.
//
// Deploy: see ../DEPLOY.md
//
// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// @ts-ignore Deno global (this file runs on Supabase Edge, not in the RN app)
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    if (!jwt) return json({ error: 'missing token' }, 401);
    // @ts-ignore Deno env
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data, error } = await admin.auth.getUser(jwt);
    if (error || !data.user) return json({ error: 'unauthorized' }, 401);
    const del = await admin.auth.admin.deleteUser(data.user.id);
    if (del.error) return json({ error: del.error.message }, 500);
    return json({ ok: true });
  } catch (e: any) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});
