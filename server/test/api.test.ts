import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import session from 'express-session';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { createApp } from '../src/app';
import { connectToDatabase, disconnectFromDatabase } from '../src/config/database';
import { UserModel } from '../src/models/user.model';
import { IdeaModel } from '../src/models/idea.model';
import { UserSessionModel } from '../src/models/user-session.model';

let mongoServer: MongoMemoryServer;
let agent: ReturnType<typeof request.agent>;

function createTestApp() {
  return createApp({
    mongoUri: mongoServer.getUri(),
    cookieSecret: 'test-cookie-secret',
    isProd: false,
    sessionStore: new session.MemoryStore(),
    enableHttpLogs: false,
  });
}

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await connectToDatabase(mongoServer.getUri());
  agent = request.agent(createTestApp());
});

test.after(async () => {
  await disconnectFromDatabase();
  if (mongoServer) await mongoServer.stop();
});

test.beforeEach(async () => {
  await UserModel.deleteMany({});
  await IdeaModel.deleteMany({});
  await UserSessionModel.deleteMany({});
  agent = request.agent(createTestApp());
});

/** Creates a shared app + MemoryStore so multiple agents share the same session store. */
function createSharedTestSetup() {
  const store = new session.MemoryStore();
  const app = createApp({
    mongoUri: mongoServer.getUri(),
    cookieSecret: 'test-cookie-secret',
    isProd: false,
    sessionStore: store,
    enableHttpLogs: false,
  });
  return { app, store };
}

test('GET /api/health returns ok', async () => {
  const response = await request.agent(createTestApp()).get('/api/health');
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { ok: true });
});

test('auth flow: register, login, session lookup, logout', async () => {
  const registerResponse = await agent
    .post('/api/auth/register')
    .send({ name: 'Test User', email: 'test@example.com', password: 'Password1!' });
  assert.equal(registerResponse.status, 201);

  const storedUser = await UserModel.findOne({ email: 'test@example.com' }).lean();
  assert.ok(storedUser);
  assert.notEqual(storedUser.password, 'Password1!');

  const loginResponse = await agent
    .post('/api/auth/login')
    .send({ email: 'test@example.com', password: 'Password1!' });
  assert.equal(loginResponse.status, 200);
  assert.equal(loginResponse.body.user.email, 'test@example.com');
  assert.equal(loginResponse.body.user.password, undefined);
  assert.match(loginResponse.headers['set-cookie'][0], /connect\.sid=/);

  const meResponse = await agent.get('/api/auth/me');
  assert.equal(meResponse.status, 200);
  assert.equal(meResponse.body.user.email, 'test@example.com');

  const logoutResponse = await agent.post('/api/auth/logout');
  assert.equal(logoutResponse.status, 200);
  assert.match(logoutResponse.headers['set-cookie'][0], /connect\.sid=/);

  const postLogoutMe = await agent.get('/api/auth/me');
  assert.equal(postLogoutMe.status, 401);
});

test('forgot-password returns a reset link in development and reset-password updates credentials', async () => {
  await agent
    .post('/api/auth/register')
    .send({ name: 'Reset User', email: 'reset@example.com', password: 'Password1!' });

  const forgotResponse = await agent
    .post('/api/auth/forgot-password')
    .send({ email: 'reset@example.com' });
  assert.equal(forgotResponse.status, 200);
  assert.match(forgotResponse.body.message, /reset link has been generated/i);
  assert.match(forgotResponse.body.resetUrl, /\/reset-password\?token=/);

  const token = new URL(forgotResponse.body.resetUrl).searchParams.get('token');
  assert.ok(token);

  const resetResponse = await agent
    .post('/api/auth/reset-password')
    .send({ token, password: 'Newpassword1!' });
  assert.equal(resetResponse.status, 200);

  const failedOldLogin = await agent
    .post('/api/auth/login')
    .send({ email: 'reset@example.com', password: 'Password1!' });
  assert.equal(failedOldLogin.status, 401);

  const newLogin = await agent
    .post('/api/auth/login')
    .send({ email: 'reset@example.com', password: 'Newpassword1!' });
  assert.equal(newLogin.status, 200);

  const storedUser = await UserModel.findOne({ email: 'reset@example.com' }).lean();
  assert.equal(storedUser!.resetPasswordTokenHash, null);
  assert.equal(storedUser!.resetPasswordExpiresAt, null);
});

test('forgot-password does not reveal whether an account exists', async () => {
  const response = await agent
    .post('/api/auth/forgot-password')
    .send({ email: 'missing@example.com' });
  assert.equal(response.status, 200);
  assert.match(response.body.message, /if an account exists/i);
  assert.equal(response.body.resetUrl, undefined);
});

test('idea routes require authentication', async () => {
  const response = await request(createTestApp()).get('/api/ideas');
  assert.equal(response.status, 401);
  assert.equal(response.body.error, 'Unauthenticated');
});

test('idea CRUD flow works for an authenticated user', async () => {
  await agent
    .post('/api/auth/register')
    .send({ name: 'Idea Owner', email: 'owner@example.com', password: 'Password1!' });
  await agent
    .post('/api/auth/login')
    .send({ email: 'owner@example.com', password: 'Password1!' });

  const createResponse = await agent
    .post('/api/ideas')
    .send({ title: 'Ship it', details: 'Write tests before refactoring.' });
  assert.equal(createResponse.status, 201);
  assert.equal(createResponse.body.title, 'Ship it');
  const ideaId = createResponse.body._id;

  const listResponse = await agent.get('/api/ideas');
  assert.equal(listResponse.status, 200);
  assert.equal(listResponse.body.length, 1);
  assert.equal(listResponse.body[0]._id, ideaId);

  const getResponse = await agent.get(`/api/ideas/${ideaId}`);
  assert.equal(getResponse.status, 200);
  assert.equal(getResponse.body.details, 'Write tests before refactoring.');

  const updateResponse = await agent
    .put(`/api/ideas/${ideaId}`)
    .send({ title: 'Ship it well', details: 'Write tests and review the API.' });
  assert.equal(updateResponse.status, 200);
  assert.equal(updateResponse.body.title, 'Ship it well');

  const deleteResponse = await agent.delete(`/api/ideas/${ideaId}`);
  assert.equal(deleteResponse.status, 200);

  const finalListResponse = await agent.get('/api/ideas');
  assert.equal(finalListResponse.status, 200);
  assert.equal(finalListResponse.body.length, 0);
});

test('invalid idea ids return 404 instead of 500', async () => {
  await agent
    .post('/api/auth/register')
    .send({ name: 'Idea Owner', email: 'owner2@example.com', password: 'Password1!' });
  await agent
    .post('/api/auth/login')
    .send({ email: 'owner2@example.com', password: 'Password1!' });

  const response = await agent.get('/api/ideas/not-a-real-id');
  assert.equal(response.status, 404);
  assert.equal(response.body.error, 'Idea not found');
});

test('users cannot access another users idea', async () => {
  const firstAgent = request.agent(createTestApp());
  const secondAgent = request.agent(createTestApp());

  await firstAgent
    .post('/api/auth/register')
    .send({ name: 'User One', email: 'one@example.com', password: 'Password1!' });
  await firstAgent
    .post('/api/auth/login')
    .send({ email: 'one@example.com', password: 'Password1!' });

  const createdIdea = await firstAgent
    .post('/api/ideas')
    .send({ title: 'Private idea', details: 'Only one user should see this.' });

  await secondAgent
    .post('/api/auth/register')
    .send({ name: 'User Two', email: 'two@example.com', password: 'Password1!' });
  await secondAgent
    .post('/api/auth/login')
    .send({ email: 'two@example.com', password: 'Password1!' });

  const response = await secondAgent.get(`/api/ideas/${createdIdea.body._id}`);
  assert.equal(response.status, 404);
});

test('weak passwords are rejected on register and reset', async () => {
  const weakRegister = await agent
    .post('/api/auth/register')
    .send({ name: 'Weak User', email: 'weak@example.com', password: 'password' });
  assert.equal(weakRegister.status, 400);
  assert.match(weakRegister.body.errors.password[0], /uppercase letter, one number, and one symbol/i);

  await agent
    .post('/api/auth/register')
    .send({ name: 'Strong User', email: 'strong@example.com', password: 'Password1!' });

  const forgotResponse = await agent
    .post('/api/auth/forgot-password')
    .send({ email: 'strong@example.com' });

  const token = new URL(forgotResponse.body.resetUrl).searchParams.get('token');

  const weakReset = await agent
    .post('/api/auth/reset-password')
    .send({ token, password: 'password' });
  assert.equal(weakReset.status, 400);
  assert.match(weakReset.body.errors.password[0], /uppercase letter, one number, and one symbol/i);
});

// ─── Session limit & management tests ──────────────────────────────────────

test('login succeeds normally when below the session limit', async () => {
  const { app } = createSharedTestSetup();
  const a = request.agent(app);

  await a.post('/api/auth/register').send({ name: 'Limit User', email: 'limit@example.com', password: 'Password1!' });

  const res = await a.post('/api/auth/login').send({ email: 'limit@example.com', password: 'Password1!' });
  assert.equal(res.status, 200);
  assert.ok(res.body.user);
  assert.equal(res.body.sessionLimited, undefined);
});

test('login enters session-limit flow when at MAX_SESSIONS_PER_USER (2)', async () => {
  const { app } = createSharedTestSetup();
  const a1 = request.agent(app);
  const a2 = request.agent(app);
  const a3 = request.agent(app);

  await a1.post('/api/auth/register').send({ name: 'Limit User2', email: 'limit2@example.com', password: 'Password1!' });

  // Fill 2 sessions
  const r1 = await a1.post('/api/auth/login').send({ email: 'limit2@example.com', password: 'Password1!' });
  assert.equal(r1.status, 200);

  const r2 = await a2.post('/api/auth/login').send({ email: 'limit2@example.com', password: 'Password1!' });
  assert.equal(r2.status, 200);

  // Third login hits the limit
  const r3 = await a3.post('/api/auth/login').send({ email: 'limit2@example.com', password: 'Password1!' });
  assert.equal(r3.status, 202);
  assert.equal(r3.body.sessionLimited, true);
  assert.ok(Array.isArray(r3.body.sessions));
  assert.equal(r3.body.sessions.length, 2);
});

test('pending session cannot access normal authenticated APIs', async () => {
  const { app } = createSharedTestSetup();
  const a1 = request.agent(app);
  const a2 = request.agent(app);
  const pending = request.agent(app);

  await a1.post('/api/auth/register').send({ name: 'Limit User3', email: 'limit3@example.com', password: 'Password1!' });
  await a1.post('/api/auth/login').send({ email: 'limit3@example.com', password: 'Password1!' });
  await a2.post('/api/auth/login').send({ email: 'limit3@example.com', password: 'Password1!' });

  // Pending session
  const pendingRes = await pending.post('/api/auth/login').send({ email: 'limit3@example.com', password: 'Password1!' });
  assert.equal(pendingRes.status, 202);

  // Cannot access ideas
  const ideasRes = await pending.get('/api/ideas');
  assert.equal(ideasRes.status, 401);

  // Cannot access /api/auth/me
  const meRes = await pending.get('/api/auth/me');
  assert.equal(meRes.status, 401);
});

test('pending session can list active sessions', async () => {
  const { app } = createSharedTestSetup();
  const a1 = request.agent(app);
  const a2 = request.agent(app);
  const pending = request.agent(app);

  await a1.post('/api/auth/register').send({ name: 'Limit User4', email: 'limit4@example.com', password: 'Password1!' });
  await a1.post('/api/auth/login').send({ email: 'limit4@example.com', password: 'Password1!' });
  await a2.post('/api/auth/login').send({ email: 'limit4@example.com', password: 'Password1!' });
  await pending.post('/api/auth/login').send({ email: 'limit4@example.com', password: 'Password1!' });

  const sessionsRes = await pending.get('/api/sessions');
  assert.equal(sessionsRes.status, 200);
  assert.ok(Array.isArray(sessionsRes.body.sessions));
  assert.equal(sessionsRes.body.sessions.length, 2);

  // Sessions expose only safe fields — no raw sessionId
  const s = sessionsRes.body.sessions[0];
  assert.ok(s.id);
  assert.ok(s.device !== undefined);
  assert.ok(s.ip !== undefined);
  assert.equal(s.sessionId, undefined, 'raw sessionId must not be exposed');
});

test('terminating an existing session allows the pending login to resolve', async () => {
  const { app } = createSharedTestSetup();
  const a1 = request.agent(app);
  const a2 = request.agent(app);
  const pending = request.agent(app);

  await a1.post('/api/auth/register').send({ name: 'Limit User5', email: 'limit5@example.com', password: 'Password1!' });
  await a1.post('/api/auth/login').send({ email: 'limit5@example.com', password: 'Password1!' });
  await a2.post('/api/auth/login').send({ email: 'limit5@example.com', password: 'Password1!' });
  const pendingRes = await pending.post('/api/auth/login').send({ email: 'limit5@example.com', password: 'Password1!' });

  // Get session list from the pending agent
  const sessionsRes = await pending.get('/api/sessions');
  assert.equal(sessionsRes.status, 200);
  const sessionToTerminate = sessionsRes.body.sessions[0];

  // Terminate one session via the pending agent
  const terminateRes = await pending.delete(`/api/sessions/${sessionToTerminate.id}`);
  assert.equal(terminateRes.status, 200);

  // Terminated session (a1 or a2) can no longer access APIs
  const terminatedAgentRes = await a1.get('/api/ideas');
  const otherAgentRes = await a2.get('/api/ideas');
  const oneBlocked = terminatedAgentRes.status === 401 || otherAgentRes.status === 401;
  assert.ok(oneBlocked, 'the terminated session must be invalidated');

  // Now the pending session can resolve
  const resolveRes = await pending.post('/api/sessions/resolve');
  assert.equal(resolveRes.status, 200);
  assert.ok(resolveRes.body.user);

  // Resolved session can now access normal APIs
  const ideasRes = await pending.get('/api/ideas');
  assert.equal(ideasRes.status, 200);
});

test('resolve is rejected when session limit is still reached', async () => {
  const { app } = createSharedTestSetup();
  const a1 = request.agent(app);
  const a2 = request.agent(app);
  const pending = request.agent(app);

  await a1.post('/api/auth/register').send({ name: 'Limit User6', email: 'limit6@example.com', password: 'Password1!' });
  await a1.post('/api/auth/login').send({ email: 'limit6@example.com', password: 'Password1!' });
  await a2.post('/api/auth/login').send({ email: 'limit6@example.com', password: 'Password1!' });
  await pending.post('/api/auth/login').send({ email: 'limit6@example.com', password: 'Password1!' });

  // Attempt to resolve without terminating anything
  const resolveRes = await pending.post('/api/sessions/resolve');
  assert.equal(resolveRes.status, 409);
  assert.match(resolveRes.body.error, /session limit still reached/i);
});

test('logged-out (revoked) sessions do not count toward the active session limit', async () => {
  const { app } = createSharedTestSetup();
  const a1 = request.agent(app);
  const a2 = request.agent(app);

  await a1.post('/api/auth/register').send({ name: 'Revoke User', email: 'revoke@example.com', password: 'Password1!' });
  await a1.post('/api/auth/login').send({ email: 'revoke@example.com', password: 'Password1!' });
  await a2.post('/api/auth/login').send({ email: 'revoke@example.com', password: 'Password1!' });

  // a2 logs out — active count drops to 1
  await a2.post('/api/auth/logout');

  // A new login should succeed (not hit the limit)
  const a3 = request.agent(app);
  const r3 = await a3.post('/api/auth/login').send({ email: 'revoke@example.com', password: 'Password1!' });
  assert.equal(r3.status, 200, 'third login after logout should succeed normally');
  assert.equal(r3.body.sessionLimited, undefined);
});

test('user cannot view or terminate another user\'s sessions', async () => {
  const { app } = createSharedTestSetup();
  const a = request.agent(app);
  const b = request.agent(app);

  await a.post('/api/auth/register').send({ name: 'User A', email: 'usera@example.com', password: 'Password1!' });
  await a.post('/api/auth/login').send({ email: 'usera@example.com', password: 'Password1!' });

  await b.post('/api/auth/register').send({ name: 'User B', email: 'userb@example.com', password: 'Password1!' });
  await b.post('/api/auth/login').send({ email: 'userb@example.com', password: 'Password1!' });

  // User B gets their own sessions
  const bSessions = await b.get('/api/sessions');
  assert.equal(bSessions.status, 200);
  assert.equal(bSessions.body.sessions.length, 1);

  // User B tries to terminate User A's session using its opaque ID
  const aSessions = await a.get('/api/sessions');
  const aSessionId = aSessions.body.sessions[0].id;

  const crossTerminate = await b.delete(`/api/sessions/${aSessionId}`);
  assert.equal(crossTerminate.status, 404, 'cross-user session termination must be rejected with 404');
});

test('current session is correctly identified in the session list', async () => {
  const { app } = createSharedTestSetup();
  const a1 = request.agent(app);
  const a2 = request.agent(app);

  await a1.post('/api/auth/register').send({ name: 'Current User', email: 'current@example.com', password: 'Password1!' });
  await a1.post('/api/auth/login').send({ email: 'current@example.com', password: 'Password1!' });
  await a2.post('/api/auth/login').send({ email: 'current@example.com', password: 'Password1!' });

  const sessionsRes = await a1.get('/api/sessions/me');
  assert.equal(sessionsRes.status, 200);

  const currentSessions = sessionsRes.body.sessions.filter((s: { isCurrent: boolean }) => s.isCurrent);
  assert.equal(currentSessions.length, 1, 'exactly one session should be marked current');

  const otherSessions = sessionsRes.body.sessions.filter((s: { isCurrent: boolean }) => !s.isCurrent);
  assert.equal(otherSessions.length, 1, 'one other session should exist');
});

test('non-authenticated request cannot access sessions endpoint', async () => {
  const { app } = createSharedTestSetup();
  const anon = request.agent(app);

  const res = await anon.get('/api/sessions');
  assert.equal(res.status, 401);
});

test('resolve endpoint rejects non-pending authenticated sessions', async () => {
  const { app } = createSharedTestSetup();
  const a = request.agent(app);

  await a.post('/api/auth/register').send({ name: 'Full Auth', email: 'fullauth@example.com', password: 'Password1!' });
  await a.post('/api/auth/login').send({ email: 'fullauth@example.com', password: 'Password1!' });

  // Fully authenticated session should not be able to call /resolve
  const resolveRes = await a.post('/api/sessions/resolve');
  assert.equal(resolveRes.status, 401);
});
