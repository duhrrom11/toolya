// Real GoTrue password signup and email confirmation, confined to a disposable local database.
const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const { readFileSync, readdirSync } = require('node:fs');
const net = require('node:net');

const database = new URL(process.env.UNIVERSE_AUTH_TEST_DB);
const authBinary = process.env.UNIVERSE_GOTRUE;
const restBinary = process.env.UNIVERSE_POSTGREST;
assert.equal(database.hostname, '127.0.0.1');
assert.equal(database.pathname, '/universe_auth_fixture');
const api = 'http://127.0.0.1:55260';
const rest = 'http://127.0.0.1:55262';
const redirect = 'http://127.0.0.1:4173/index.html?auth=required&next=%2Ftools%2Fmoving%2F';
const jwtSecret = 'synthetic-jwt-key-never-used-outside-local-auth-fixture';

function sql(query) {
  const result = spawnSync('psql', [database.href, '-XqAt', '-v', 'ON_ERROR_STOP=1'], {
    input: query, encoding: 'utf8',
  });
  if (result.status !== 0) throw Error(result.stderr || result.error?.message);
  return result.stdout.trim();
}

function mailbox(messages) {
  return net.createServer(socket => {
    socket.write('220 fixture ESMTP ready\r\n');
    socket.setEncoding('utf8');
    let pending = '';
    let content = null;
    socket.on('data', chunk => {
      pending += chunk;
      const lines = pending.split('\r\n');
      pending = lines.pop();
      for (const line of lines) {
        if (content) {
          if (line === '.') {
            messages.push(content.join('\n'));
            content = null;
            socket.write('250 retained locally\r\n');
          } else content.push(line);
        } else if (line === 'DATA') {
          content = [];
          socket.write('354 send message\r\n');
        } else if (line === 'QUIT') socket.end('221 bye\r\n');
        else socket.write('250 fixture\r\n');
      }
    });
  });
}

async function waitReady(url, name) {
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch(url)).ok) return; } catch { /* service is booting */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw Error(`Local ${name} did not start`);
}

async function verifyRest(accessToken, profile) {
  const rpc = (name, payload, token) => fetch(rest + '/rpc/universe_' + name, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token && { authorization: 'Bearer ' + token }) },
    body: JSON.stringify(payload),
  });
  const guest = await rpc('state', {});
  assert.equal(guest.status, 401, 'The anonymous API role cannot read an account');
  const state = await rpc('state', {}, accessToken);
  const initialState = await state.json();
  assert.equal(state.status, 200, initialState.message);
  assert.deepEqual(initialState, {
    active: false, chapter: 0, decor: '', visible: false, handle: null, profile, xp: 0,
  });
  const privateTable = await fetch(rest + '/players', {
    headers: { authorization: 'Bearer ' + accessToken, 'accept-profile': 'toolya_universe' },
  });
  assert.equal(privateTable.status, 406, 'The private schema must not be exposed by the data API');
  const active = await rpc('toggle', { p_active: true }, accessToken);
  assert.equal(active.status, 200);
  assert.equal((await active.json()).active, true);
  const answer = await rpc('answer', { p_step: 0, p_answer: 1 }, accessToken);
  assert.equal(answer.status, 200);
  assert.equal((await answer.json()).chapter, 1);
  const saved = await rpc('state', {}, accessToken);
  assert.equal(saved.status, 200);
  assert.equal((await saved.json()).chapter, 1);
  async function readRanking() {
    const response = await rpc('ranking', {}, accessToken);
    assert.equal(response.status, 200);
    return response.json();
  }
  assert.deepEqual(await readRanking(), []);
  const visible = await rpc('visibility', { p_visible: true, p_handle: 'Nebel-Wanderer' }, accessToken);
  assert.equal(visible.status, 200);
  assert.deepEqual(await readRanking(), [{ handle: 'Nebel-Wanderer', xp: 0 }]);
  const paused = await rpc('toggle', { p_active: false }, accessToken);
  assert.equal(paused.status, 200);
  assert.equal((await paused.json()).visible, false);
  assert.deepEqual(await readRanking(), []);
}

async function run() {
  const messages = [];
  const smtp = mailbox(messages);
  await new Promise(resolve => smtp.listen(55261, '127.0.0.1', resolve));
  let server, dataApi;
  try {
    sql(`create schema auth;
      do $$ begin
        if not exists (select 1 from pg_roles where rolname = 'postgres') then create role postgres; end if;
        if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
        if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
      end $$;`);
    const backend = new URL(database);
    backend.searchParams.set('search_path', 'auth,public');
    const env = {
      ...process.env, GOTRUE_DB_DRIVER: 'postgres', GOTRUE_DB_NAMESPACE: 'auth',
      GOTRUE_DB_DATABASE_URL: backend.href,
      GOTRUE_JWT_SECRET: jwtSecret,
      GOTRUE_JWT_DEFAULT_GROUP_NAME: 'authenticated',
      GOTRUE_SITE_URL: 'http://127.0.0.1:4173', GOTRUE_URI_ALLOW_LIST: 'http://127.0.0.1:4173/**',
      API_EXTERNAL_URL: api, GOTRUE_API_HOST: '127.0.0.1', GOTRUE_API_PORT: '55260',
      GOTRUE_EXTERNAL_EMAIL_ENABLED: 'true', GOTRUE_MAILER_AUTOCONFIRM: 'false',
      GOTRUE_SMTP_HOST: '127.0.0.1', GOTRUE_SMTP_PORT: '55261',
      GOTRUE_SMTP_ADMIN_EMAIL: 'fixture@example.invalid', GOTRUE_SMTP_MAX_FREQUENCY: '1s',
    };
    const migration = spawnSync(authBinary, ['migrate'], { env, encoding: 'utf8' });
    if (migration.status !== 0) throw Error(migration.stderr || migration.error?.message);
    server = spawn(authBinary, ['serve'], { env, stdio: 'ignore' });
    await waitReady(api + '/health', 'GoTrue');
    sql(readFileSync('tests/universe/tool-fixture.sql', 'utf8'));
    const file = readdirSync('supabase/migrations').find(name => name.endsWith('_toolya_universe.sql'));
    sql(readFileSync('supabase/migrations/' + file, 'utf8'));

    const post = (route, payload) => fetch(api + route, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
    });
    const credentials = { email: 'new-universe@example.invalid', password: 'synthetic-local-only-password' };
    assert((await post('/signup', credentials)).status >= 400, 'GoTrue must reject missing names');
    const profile = { first: 'Éva', last: 'Nguyễn', country: 'DE', avatar: null };
    const signup = await post('/signup?redirect_to=' + encodeURIComponent(redirect), {
      ...credentials, data: { toolya_profile: profile },
    });
    assert(signup.ok, 'GoTrue must accept valid names');
    assert.equal((await signup.json()).access_token, undefined);
    assert.equal((await post('/token?grant_type=password', credentials)).status, 400);
    assert.equal(messages.length, 1);
    const plain = messages[0].replace(/=\n/g, '').replaceAll('=3D', '=').replaceAll('&amp;', '&');
    const verifyURL = plain.match(/http:\/\/127\.0\.0\.1:55260\/verify\?[^\s"<>]+/)?.[0];
    assert(verifyURL, 'Confirmation link must arrive in the local mailbox');
    const confirmation = await fetch(verifyURL, { redirect: 'manual' });
    assert.equal(confirmation.status, 303);
    const confirmedLocation = new URL(confirmation.headers.get('location'));
    assert.equal(confirmedLocation.searchParams.get('next'), '/tools/moving/');
    const confirmationToken = new URLSearchParams(confirmedLocation.hash.slice(1)).get('access_token');
    assert(confirmationToken, 'Confirmation must issue a session for the return flow');
    const initialClaims = JSON.parse(Buffer.from(confirmationToken.split('.')[1], 'base64url'));
    assert.equal(initialClaims.user_metadata.toolya_profile, undefined);
    const signIn = await post('/token?grant_type=password', credentials);
    assert(signIn.ok, 'Confirmed account can sign in');
    const { user, access_token: accessToken } = await signIn.json();
    assert.match(user.id, /^[a-f0-9-]{36}$/);
    assert.deepEqual(JSON.parse(sql("select profile from toolya_universe.players where user_id='" + user.id + "';")), profile);
    assert.equal(user.user_metadata.toolya_profile, undefined);
    const token = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url'));
    assert.equal(token.user_metadata.toolya_profile, undefined);
    console.log('GoTrue: required names, local email confirmation, original route and private profile without duplicated Auth metadata verified');

    if (restBinary) {
      sql(readFileSync('tests/universe/rest-fixture.sql', 'utf8'));
      const connection = new URL(database);
      connection.username = 'universe_authenticator';
      connection.password = 'isolated-rest-only';
      dataApi = spawn(restBinary, [], { stdio: 'inherit', env: {
        ...process.env, PGRST_DB_URI: connection.href, PGRST_DB_SCHEMAS: 'public',
        PGRST_DB_ANON_ROLE: 'anon', PGRST_JWT_SECRET: jwtSecret, PGRST_SERVER_HOST: '127.0.0.1',
        PGRST_SERVER_PORT: '55262', PGRST_LOG_LEVEL: 'warn',
      } });
      await waitReady(rest + '/', 'PostgREST');
      await verifyRest(confirmationToken, profile);
      console.log('PostgREST: confirmed GoTrue session, anonymous denial, private schema, quest persistence and leaderboard opt-in verified');
    }
  } finally {
    if (dataApi) dataApi.kill();
    if (server) server.kill();
    smtp.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
