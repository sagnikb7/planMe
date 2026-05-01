import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import session from 'express-session';
import mongoose from 'mongoose';

import { createApp } from '../../src/app';
import { connectToDatabase, disconnectFromDatabase } from '../../src/config/database';
import { UserModel } from '../../src/models/user.model';
import { IdeaModel } from '../../src/models/idea.model';
import { UserSessionModel } from '../../src/models/user-session.model';
import { lookupLocation } from '../../src/utils/geo';
import { MAX_SESSIONS_PER_USER } from '../../src/constants';

const TEST_MONGO_URI = process.env.MONGO_TEST_URI ?? 'mongodb://127.0.0.1:27017/planme_test';

let agent: ReturnType<typeof request.agent>;

function createTestApp() {
  return createApp({
    mongoUri: TEST_MONGO_URI,
    cookieSecret: 'test-cookie-secret',
    isProd: false,
    sessionStore: new session.MemoryStore(),
    enableHttpLogs: false,
  });
}

function createSharedTestSetup() {
  const store = new session.MemoryStore();
  const app = createApp({
    mongoUri: TEST_MONGO_URI,
    cookieSecret: 'test-cookie-secret',
    isProd: false,
    sessionStore: store,
    enableHttpLogs: false,
  });
  return { app, store };
}

beforeAll(async () => {
  await connectToDatabase(TEST_MONGO_URI);
  agent = request.agent(createTestApp());
});

afterAll(async () => {
  await mongoose.connection.db?.dropDatabase();
  await disconnectFromDatabase();
});

beforeEach(async () => {
  await UserModel.deleteMany({});
  await IdeaModel.deleteMany({});
  await UserSessionModel.deleteMany({});
  agent = request.agent(createTestApp());
});

// ─── Health ──────────────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  it('returns 200 with status ok and mongo state', async () => {
    const res = await request.agent(createTestApp()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.services.mongodb.status).toBe('ok');
    expect(res.body.uptime).toBeTypeOf('number');
    expect(res.body.process.nodeVersion).toMatch(/^v/);
  });
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

describe('POST /api/auth/register — duplicate email', () => {
  it('returns 409 when email is already registered', async () => {
    await agent.post('/api/auth/register').send({ name: 'First', email: 'dup@example.com', password: 'Password1!' });
    const res = await agent.post('/api/auth/register').send({ name: 'Second', email: 'dup@example.com', password: 'Password1!' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already registered/i);
  });

  it('stores email as lowercase regardless of input casing', async () => {
    await agent.post('/api/auth/register').send({ name: 'Cased', email: 'CASED@EXAMPLE.COM', password: 'Password1!' });
    const stored = await UserModel.findOne({ email: 'cased@example.com' }).lean();
    expect(stored).toBeTruthy();
  });
});

describe('POST /api/auth/login — failure cases', () => {
  it('returns 401 for wrong password', async () => {
    await agent.post('/api/auth/register').send({ name: 'Login', email: 'logintest@example.com', password: 'Password1!' });
    const res = await agent.post('/api/auth/login').send({ email: 'logintest@example.com', password: 'WrongPass1!' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for non-existent email', async () => {
    const res = await agent.post('/api/auth/login').send({ email: 'nobody@example.com', password: 'Password1!' });
    expect(res.status).toBe(401);
  });
});

describe('auth flow: register → login → /me → logout', () => {
  it('completes full auth cycle', async () => {
    const register = await agent
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'test@example.com', password: 'Password1!' });
    expect(register.status).toBe(201);

    const stored = await UserModel.findOne({ email: 'test@example.com' }).lean();
    expect(stored).toBeTruthy();
    expect(stored!.password).not.toBe('Password1!');

    const login = await agent
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Password1!' });
    expect(login.status).toBe(200);
    expect(login.body.user.email).toBe('test@example.com');
    expect(login.body.user.password).toBeUndefined();
    expect(login.headers['set-cookie'][0]).toMatch(/connect\.sid=/);

    expect((await agent.get('/api/auth/me')).status).toBe(200);

    const logout = await agent.post('/api/auth/logout');
    expect(logout.status).toBe(200);

    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });
});

describe('PATCH /api/auth/me', () => {
  it('updates display name and reflects in /me response', async () => {
    await agent.post('/api/auth/register').send({ name: 'Alice', email: 'alice@example.com', password: 'Password1!' });
    await agent.post('/api/auth/login').send({ email: 'alice@example.com', password: 'Password1!' });

    const patch = await agent.patch('/api/auth/me').send({ name: 'Alice Updated' });
    expect(patch.status).toBe(200);
    expect(patch.body.user.name).toBe('Alice Updated');

    const me = await agent.get('/api/auth/me');
    expect(me.body.user.name).toBe('Alice Updated');
  });

  it('rejects name shorter than 2 characters', async () => {
    await agent.post('/api/auth/register').send({ name: 'Alice', email: 'alice2@example.com', password: 'Password1!' });
    await agent.post('/api/auth/login').send({ email: 'alice2@example.com', password: 'Password1!' });

    const res = await agent.patch('/api/auth/me').send({ name: 'A' });
    expect(res.status).toBe(400);
  });

  it('requires authentication', async () => {
    const res = await request(createTestApp()).patch('/api/auth/me').send({ name: 'Alice' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/change-password', () => {
  it('changes password successfully with correct current password', async () => {
    await agent.post('/api/auth/register').send({ name: 'Bob', email: 'bob@example.com', password: 'Password1!' });
    await agent.post('/api/auth/login').send({ email: 'bob@example.com', password: 'Password1!' });

    const res = await agent
      .post('/api/auth/change-password')
      .send({ currentPassword: 'Password1!', newPassword: 'NewPassword1!' });
    expect(res.status).toBe(200);

    // Old password no longer works
    const badLogin = await request.agent(createTestApp())
      .post('/api/auth/login')
      .send({ email: 'bob@example.com', password: 'Password1!' });
    expect(badLogin.status).toBe(401);

    // New password works
    const goodLogin = await request.agent(createTestApp())
      .post('/api/auth/login')
      .send({ email: 'bob@example.com', password: 'NewPassword1!' });
    expect(goodLogin.status).toBe(200);
  });

  it('rejects wrong current password', async () => {
    await agent.post('/api/auth/register').send({ name: 'Bob', email: 'bob2@example.com', password: 'Password1!' });
    await agent.post('/api/auth/login').send({ email: 'bob2@example.com', password: 'Password1!' });

    const res = await agent
      .post('/api/auth/change-password')
      .send({ currentPassword: 'WrongPass1!', newPassword: 'NewPassword1!' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/incorrect/i);
  });

  it('rejects a weak new password', async () => {
    await agent.post('/api/auth/register').send({ name: 'Bob', email: 'bob3@example.com', password: 'Password1!' });
    await agent.post('/api/auth/login').send({ email: 'bob3@example.com', password: 'Password1!' });

    const res = await agent
      .post('/api/auth/change-password')
      .send({ currentPassword: 'Password1!', newPassword: 'weak' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/auth/me', () => {
  it('deletes account: ideas gone, session invalidated', async () => {
    await agent.post('/api/auth/register').send({ name: 'Delete Me', email: 'delete@example.com', password: 'Password1!' });
    await agent.post('/api/auth/login').send({ email: 'delete@example.com', password: 'Password1!' });
    await agent.post('/api/ideas').send({ title: 'To be gone', details: 'bye' });

    const del = await agent.delete('/api/auth/me');
    expect(del.status).toBe(200);

    expect((await agent.get('/api/auth/me')).status).toBe(401);
    expect(await IdeaModel.countDocuments({})).toBe(0);
    expect(await UserModel.findOne({ email: 'delete@example.com' })).toBeNull();
  });

  it('requires authentication', async () => {
    expect((await request(createTestApp()).delete('/api/auth/me')).status).toBe(401);
  });
});

describe('password reset flow', () => {
  it('issues reset link in dev and allows password change', async () => {
    await agent.post('/api/auth/register').send({ name: 'Reset User', email: 'reset@example.com', password: 'Password1!' });

    const forgot = await agent.post('/api/auth/forgot-password').send({ email: 'reset@example.com' });
    expect(forgot.status).toBe(200);
    expect(forgot.body.resetUrl).toMatch(/\/reset-password\?token=/);

    const token = new URL(forgot.body.resetUrl).searchParams.get('token')!;
    expect((await agent.post('/api/auth/reset-password').send({ token, password: 'Newpassword1!' })).status).toBe(200);

    expect((await agent.post('/api/auth/login').send({ email: 'reset@example.com', password: 'Password1!' })).status).toBe(401);
    expect((await agent.post('/api/auth/login').send({ email: 'reset@example.com', password: 'Newpassword1!' })).status).toBe(200);

    const stored = await UserModel.findOne({ email: 'reset@example.com' }).lean();
    expect(stored!.resetPasswordTokenHash).toBeNull();
    expect(stored!.resetPasswordExpiresAt).toBeNull();
  });

  it('does not reveal whether an account exists', async () => {
    const res = await agent.post('/api/auth/forgot-password').send({ email: 'missing@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/if an account exists/i);
    expect(res.body.resetUrl).toBeUndefined();
  });

  it('rejects an expired token', async () => {
    await agent.post('/api/auth/register').send({ name: 'Expire', email: 'expire@example.com', password: 'Password1!' });
    const forgot = await agent.post('/api/auth/forgot-password').send({ email: 'expire@example.com' });
    const token = new URL(forgot.body.resetUrl).searchParams.get('token')!;

    await UserModel.updateOne({ email: 'expire@example.com' }, { resetPasswordExpiresAt: new Date(Date.now() - 1000) });

    const res = await agent.post('/api/auth/reset-password').send({ token, password: 'Newpassword1!' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid or expired/i);
  });

  it('rejects a token used twice', async () => {
    await agent.post('/api/auth/register').send({ name: 'Reuse', email: 'reuse@example.com', password: 'Password1!' });
    const forgot = await agent.post('/api/auth/forgot-password').send({ email: 'reuse@example.com' });
    const token = new URL(forgot.body.resetUrl).searchParams.get('token')!;

    expect((await agent.post('/api/auth/reset-password').send({ token, password: 'Newpassword1!' })).status).toBe(200);
    expect((await agent.post('/api/auth/reset-password').send({ token, password: 'Anotherpass1!' })).status).toBe(400);
  });

  it('does not expose resetUrl in production mode', async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      await agent.post('/api/auth/register').send({ name: 'Prod', email: 'prod@example.com', password: 'Password1!' });
      const res = await agent.post('/api/auth/forgot-password').send({ email: 'prod@example.com' });
      expect(res.status).toBe(200);
      expect(res.body.resetUrl).toBeUndefined();
      const stored = await UserModel.findOne({ email: 'prod@example.com' }).lean();
      expect(stored?.resetPasswordTokenHash).toBeTruthy();
    } finally {
      process.env.NODE_ENV = prev;
    }
  });

  it('rejects weak passwords on register and reset', async () => {
    const bad = await agent.post('/api/auth/register').send({ name: 'Weak', email: 'weak@example.com', password: 'password' });
    expect(bad.status).toBe(400);
    expect(bad.body.errors.password[0]).toMatch(/uppercase letter, one number, and one symbol/i);

    await agent.post('/api/auth/register').send({ name: 'Strong', email: 'strong@example.com', password: 'Password1!' });
    const forgot = await agent.post('/api/auth/forgot-password').send({ email: 'strong@example.com' });
    const token = new URL(forgot.body.resetUrl).searchParams.get('token')!;
    const weakReset = await agent.post('/api/auth/reset-password').send({ token, password: 'password' });
    expect(weakReset.status).toBe(400);
  });
});

// ─── Ideas ────────────────────────────────────────────────────────────────────

describe('ideas require authentication', () => {
  it('returns 401 for unauthenticated GET', async () => {
    expect((await request(createTestApp()).get('/api/ideas')).status).toBe(401);
  });
});

describe('idea CRUD', () => {
  it('creates, lists, gets, updates, and deletes an idea', async () => {
    await agent.post('/api/auth/register').send({ name: 'Owner', email: 'owner@example.com', password: 'Password1!' });
    await agent.post('/api/auth/login').send({ email: 'owner@example.com', password: 'Password1!' });

    const created = await agent.post('/api/ideas').send({ title: 'Ship it', details: 'Write tests.' });
    expect(created.status).toBe(201);
    const id = created.body._id;

    const list = await agent.get('/api/ideas');
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);

    const get = await agent.get(`/api/ideas/${id}`);
    expect(get.status).toBe(200);
    expect(get.body.details).toBe('Write tests.');

    const updated = await agent.put(`/api/ideas/${id}`).send({ title: 'Ship it well', details: 'Tests first.' });
    expect(updated.status).toBe(200);
    expect(updated.body.title).toBe('Ship it well');

    expect((await agent.delete(`/api/ideas/${id}`)).status).toBe(200);
    expect((await agent.get('/api/ideas')).body).toHaveLength(0);
  });

  it('returns 404 for invalid idea id format', async () => {
    await agent.post('/api/auth/register').send({ name: 'Owner', email: 'owner2@example.com', password: 'Password1!' });
    await agent.post('/api/auth/login').send({ email: 'owner2@example.com', password: 'Password1!' });
    const res = await agent.get('/api/ideas/not-a-real-id');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Idea not found');
  });

  it("cannot access another user's idea", async () => {
    const { app } = createSharedTestSetup();
    const a = request.agent(app);
    const b = request.agent(app);

    await a.post('/api/auth/register').send({ name: 'One', email: 'one@example.com', password: 'Password1!' });
    await a.post('/api/auth/login').send({ email: 'one@example.com', password: 'Password1!' });
    const idea = await a.post('/api/ideas').send({ title: 'Private', details: 'Only mine.' });

    await b.post('/api/auth/register').send({ name: 'Two', email: 'two@example.com', password: 'Password1!' });
    await b.post('/api/auth/login').send({ email: 'two@example.com', password: 'Password1!' });

    expect((await b.get(`/api/ideas/${idea.body._id}`)).status).toBe(404);
  });

  it("cannot update another user's idea", async () => {
    const { app } = createSharedTestSetup();
    const a = request.agent(app);
    const b = request.agent(app);

    await a.post('/api/auth/register').send({ name: 'Ua', email: 'isola@example.com', password: 'Password1!' });
    await a.post('/api/auth/login').send({ email: 'isola@example.com', password: 'Password1!' });
    const idea = await a.post('/api/ideas').send({ title: 'Mine', details: 'Private.' });

    await b.post('/api/auth/register').send({ name: 'Ub', email: 'isolb@example.com', password: 'Password1!' });
    await b.post('/api/auth/login').send({ email: 'isolb@example.com', password: 'Password1!' });

    expect((await b.put(`/api/ideas/${idea.body._id}`).send({ title: 'Stolen', details: 'Nope' })).status).toBe(404);
  });

  it("cannot delete another user's idea", async () => {
    const { app } = createSharedTestSetup();
    const a = request.agent(app);
    const b = request.agent(app);

    await a.post('/api/auth/register').send({ name: 'Uc', email: 'isolc@example.com', password: 'Password1!' });
    await a.post('/api/auth/login').send({ email: 'isolc@example.com', password: 'Password1!' });
    const idea = await a.post('/api/ideas').send({ title: 'Keep', details: 'Mine.' });

    await b.post('/api/auth/register').send({ name: 'Ud', email: 'isold@example.com', password: 'Password1!' });
    await b.post('/api/auth/login').send({ email: 'isold@example.com', password: 'Password1!' });

    expect((await b.delete(`/api/ideas/${idea.body._id}`)).status).toBe(404);
  });

  it('preserves tags on update', async () => {
    await agent.post('/api/auth/register').send({ name: 'Taggy', email: 'taggy@example.com', password: 'Password1!' });
    await agent.post('/api/auth/login').send({ email: 'taggy@example.com', password: 'Password1!' });
    const id = (await agent.post('/api/ideas').send({ title: 'Tagged', details: 'ok', tags: ['alpha'] })).body._id;

    const updated = await agent.put(`/api/ideas/${id}`).send({ title: 'Tagged', details: 'ok', tags: ['beta', 'gamma'] });
    expect(updated.status).toBe(200);
    expect(updated.body.tags).toEqual(expect.arrayContaining(['beta', 'gamma']));
    expect(updated.body.tags).not.toContain('alpha');
  });
});

describe('PATCH /api/ideas/:id/pin', () => {
  it('pins and unpins an idea', async () => {
    await agent.post('/api/auth/register').send({ name: 'Pinner', email: 'pinner@example.com', password: 'Password1!' });
    await agent.post('/api/auth/login').send({ email: 'pinner@example.com', password: 'Password1!' });
    const id = (await agent.post('/api/ideas').send({ title: 'Pinnable', details: 'yes' })).body._id;

    const pinned = await agent.patch(`/api/ideas/${id}/pin`).send({ pinned: true });
    expect(pinned.status).toBe(200);
    expect(pinned.body.pinned).toBe(true);

    const unpinned = await agent.patch(`/api/ideas/${id}/pin`).send({ pinned: false });
    expect(unpinned.status).toBe(200);
    expect(unpinned.body.pinned).toBe(false);
  });

  it('rejects pinning a non-boolean value', async () => {
    await agent.post('/api/auth/register').send({ name: 'BadPin', email: 'badpin@example.com', password: 'Password1!' });
    await agent.post('/api/auth/login').send({ email: 'badpin@example.com', password: 'Password1!' });
    const id = (await agent.post('/api/ideas').send({ title: 'T', details: 'D' })).body._id;
    expect((await agent.patch(`/api/ideas/${id}/pin`).send({ pinned: 'yes' })).status).toBe(400);
  });
});

describe('PATCH /api/ideas/:id/status', () => {
  it('archives and restores an idea, returning full updated doc', async () => {
    await agent.post('/api/auth/register').send({ name: 'Status', email: 'status@example.com', password: 'Password1!' });
    await agent.post('/api/auth/login').send({ email: 'status@example.com', password: 'Password1!' });
    const id = (await agent.post('/api/ideas').send({ title: 'Test', details: 'Details' })).body._id;

    const archived = await agent.patch(`/api/ideas/${id}/status`).send({ status: 'archived' });
    expect(archived.status).toBe(200);
    expect(archived.body.status).toBe('archived');
    expect(archived.body.updatedAt).toBeTruthy();

    const restored = await agent.patch(`/api/ideas/${id}/status`).send({ status: 'draft' });
    expect(restored.status).toBe(200);
    expect(restored.body.status).toBe('draft');
  });

  it('rejects an invalid status value', async () => {
    await agent.post('/api/auth/register').send({ name: 'Bad', email: 'badstatus@example.com', password: 'Password1!' });
    await agent.post('/api/auth/login').send({ email: 'badstatus@example.com', password: 'Password1!' });
    const id = (await agent.post('/api/ideas').send({ title: 'T', details: 'D' })).body._id;
    expect((await agent.patch(`/api/ideas/${id}/status`).send({ status: 'published' })).status).toBe(400);
  });
});

describe('PATCH /api/ideas/reorder', () => {
  it('persists a new idea order', async () => {
    await agent.post('/api/auth/register').send({ name: 'Reorder', email: 'reorder@example.com', password: 'Password1!' });
    await agent.post('/api/auth/login').send({ email: 'reorder@example.com', password: 'Password1!' });

    const a = (await agent.post('/api/ideas').send({ title: 'A', details: 'first' })).body._id;
    const b = (await agent.post('/api/ideas').send({ title: 'B', details: 'second' })).body._id;
    const c = (await agent.post('/api/ideas').send({ title: 'C', details: 'third' })).body._id;

    const res = await agent.patch('/api/ideas/reorder').send({ ids: [c, a, b] });
    expect(res.status).toBe(200);

    const list = (await agent.get('/api/ideas')).body as { _id: string }[];
    const ordered = list.map((i) => i._id);
    expect(ordered).toEqual([c, a, b]);
  });
});

describe('GET /api/ideas/tags', () => {
  it('returns tags with usage counts', async () => {
    await agent.post('/api/auth/register').send({ name: 'Tags', email: 'tags@example.com', password: 'Password1!' });
    await agent.post('/api/auth/login').send({ email: 'tags@example.com', password: 'Password1!' });
    await agent.post('/api/ideas').send({ title: 'A', details: 'x', tags: ['alpha', 'beta'] });
    await agent.post('/api/ideas').send({ title: 'B', details: 'x', tags: ['alpha'] });

    const res = await agent.get('/api/ideas/tags');
    expect(res.status).toBe(200);
    expect(res.body.tags.find((t: { tag: string }) => t.tag === 'alpha')?.count).toBe(2);
    expect(res.body.tags.find((t: { tag: string }) => t.tag === 'beta')?.count).toBe(1);
    expect(res.body.limit).toBeTypeOf('number');
  });
});

describe('PATCH /api/ideas/tags/:tag', () => {
  it('renames a tag across all ideas', async () => {
    await agent.post('/api/auth/register').send({ name: 'Rename', email: 'rename@example.com', password: 'Password1!' });
    await agent.post('/api/auth/login').send({ email: 'rename@example.com', password: 'Password1!' });
    await agent.post('/api/ideas').send({ title: 'A', details: 'x', tags: ['oldtag'] });
    await agent.post('/api/ideas').send({ title: 'B', details: 'x', tags: ['oldtag'] });

    const res = await agent.patch('/api/ideas/tags/oldtag').send({ name: 'newtag' });
    expect(res.status).toBe(200);

    const tags = (await agent.get('/api/ideas/tags')).body.tags.map((t: { tag: string }) => t.tag);
    expect(tags).toContain('newtag');
    expect(tags).not.toContain('oldtag');
  });

  it('rejects rename to an already existing tag', async () => {
    await agent.post('/api/auth/register').send({ name: 'Dupe', email: 'dupe@example.com', password: 'Password1!' });
    await agent.post('/api/auth/login').send({ email: 'dupe@example.com', password: 'Password1!' });
    await agent.post('/api/ideas').send({ title: 'A', details: 'x', tags: ['aa', 'bb'] });

    const res = await agent.patch('/api/ideas/tags/aa').send({ name: 'bb' });
    expect(res.status).toBe(400);
  });
});

describe('idea limit', () => {
  it('rejects creation once IDEA_LIMIT is reached', async () => {
    await agent.post('/api/auth/register').send({ name: 'Limit', email: 'idealimit@example.com', password: 'Password1!' });
    await agent.post('/api/auth/login').send({ email: 'idealimit@example.com', password: 'Password1!' });

    // Bulk-insert directly to bypass service limit check for setup speed
    const uid = (await UserModel.findOne({ email: 'idealimit@example.com' }))!._id;
    const docs = Array.from({ length: 100 }, (_, i) => ({
      title: `Idea ${i}`,
      details: 'x',
      tags: [],
      status: 'draft',
      user: uid,
      sortOrder: i,
    }));
    await IdeaModel.insertMany(docs);

    const res = await agent.post('/api/ideas').send({ title: 'One too many', details: 'over the limit' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/idea limit/i);
  }, 30_000);
});

// ─── Geo util ─────────────────────────────────────────────────────────────────

describe('lookupLocation', () => {
  it('returns a non-Local result for a known public IP', () => {
    const loc = lookupLocation('8.8.8.8');
    expect(loc.length).toBeGreaterThan(0);
    expect(loc).not.toBe('Local');
    expect(loc).not.toBe('Unknown location');
  });

  it('returns Local for private and loopback IPs', () => {
    expect(lookupLocation('127.0.0.1')).toBe('Local');
    expect(lookupLocation('::1')).toBe('Local');
    expect(lookupLocation('192.168.1.1')).toBe('Local');
    expect(lookupLocation('10.0.0.1')).toBe('Local');
    expect(lookupLocation('172.16.0.1')).toBe('Local');
  });
});

// ─── Sessions & limit flow ────────────────────────────────────────────────────

describe('session management', () => {
  it('normal login succeeds when below the session limit', async () => {
    const { app } = createSharedTestSetup();
    const a = request.agent(app);
    await a.post('/api/auth/register').send({ name: 'Normal', email: 'normal@example.com', password: 'Password1!' });
    const res = await a.post('/api/auth/login').send({ email: 'normal@example.com', password: 'Password1!' });
    expect(res.status).toBe(200);
    expect(res.body.sessionLimited).toBeUndefined();
  });

  it(`enters session-limit flow when at MAX_SESSIONS_PER_USER (${MAX_SESSIONS_PER_USER})`, async () => {
    const { app } = createSharedTestSetup();
    const agents = Array.from({ length: MAX_SESSIONS_PER_USER + 1 }, () => request.agent(app));

    await agents[0].post('/api/auth/register').send({ name: 'Limit', email: 'sessionlimit@example.com', password: 'Password1!' });

    for (let i = 0; i < MAX_SESSIONS_PER_USER; i++) {
      const r = await agents[i].post('/api/auth/login').send({ email: 'sessionlimit@example.com', password: 'Password1!' });
      expect(r.status).toBe(200);
    }

    const over = await agents[MAX_SESSIONS_PER_USER]
      .post('/api/auth/login')
      .send({ email: 'sessionlimit@example.com', password: 'Password1!' });
    expect(over.status).toBe(202);
    expect(over.body.sessionLimited).toBe(true);
    expect(over.body.sessions).toHaveLength(MAX_SESSIONS_PER_USER);
  });

  it('pending session cannot access normal authenticated APIs', async () => {
    const { app } = createSharedTestSetup();
    const agents = Array.from({ length: MAX_SESSIONS_PER_USER + 1 }, () => request.agent(app));
    const pending = agents[MAX_SESSIONS_PER_USER];

    await agents[0].post('/api/auth/register').send({ name: 'P', email: 'pending@example.com', password: 'Password1!' });
    for (let i = 0; i < MAX_SESSIONS_PER_USER; i++) {
      await agents[i].post('/api/auth/login').send({ email: 'pending@example.com', password: 'Password1!' });
    }
    await pending.post('/api/auth/login').send({ email: 'pending@example.com', password: 'Password1!' });

    expect((await pending.get('/api/ideas')).status).toBe(401);
    expect((await pending.get('/api/auth/me')).status).toBe(401);
  });

  it('pending session can list active sessions and sessions expose only safe fields', async () => {
    const { app } = createSharedTestSetup();
    const agents = Array.from({ length: MAX_SESSIONS_PER_USER + 1 }, () => request.agent(app));
    const pending = agents[MAX_SESSIONS_PER_USER];

    await agents[0].post('/api/auth/register').send({ name: 'P2', email: 'pending2@example.com', password: 'Password1!' });
    for (let i = 0; i < MAX_SESSIONS_PER_USER; i++) {
      await agents[i].post('/api/auth/login').send({ email: 'pending2@example.com', password: 'Password1!' });
    }
    await pending.post('/api/auth/login').send({ email: 'pending2@example.com', password: 'Password1!' });

    const res = await pending.get('/api/sessions');
    expect(res.status).toBe(200);
    expect(res.body.sessions).toHaveLength(MAX_SESSIONS_PER_USER);

    const s = res.body.sessions[0];
    expect(s.id).toBeTruthy();
    expect(s.sessionId).toBeUndefined();
  });

  it('terminating a session allows the pending login to resolve', async () => {
    const { app } = createSharedTestSetup();
    const agents = Array.from({ length: MAX_SESSIONS_PER_USER + 1 }, () => request.agent(app));
    const pending = agents[MAX_SESSIONS_PER_USER];

    await agents[0].post('/api/auth/register').send({ name: 'P3', email: 'pending3@example.com', password: 'Password1!' });
    for (let i = 0; i < MAX_SESSIONS_PER_USER; i++) {
      await agents[i].post('/api/auth/login').send({ email: 'pending3@example.com', password: 'Password1!' });
    }
    await pending.post('/api/auth/login').send({ email: 'pending3@example.com', password: 'Password1!' });

    const sessions = (await pending.get('/api/sessions')).body.sessions;
    await pending.delete(`/api/sessions/${sessions[0].id}`);

    const resolve = await pending.post('/api/sessions/resolve');
    expect(resolve.status).toBe(200);
    expect(resolve.body.user).toBeTruthy();

    expect((await pending.get('/api/ideas')).status).toBe(200);
  });

  it('resolve is rejected when session limit is still reached', async () => {
    const { app } = createSharedTestSetup();
    const agents = Array.from({ length: MAX_SESSIONS_PER_USER + 1 }, () => request.agent(app));
    const pending = agents[MAX_SESSIONS_PER_USER];

    await agents[0].post('/api/auth/register').send({ name: 'P4', email: 'pending4@example.com', password: 'Password1!' });
    for (let i = 0; i < MAX_SESSIONS_PER_USER; i++) {
      await agents[i].post('/api/auth/login').send({ email: 'pending4@example.com', password: 'Password1!' });
    }
    await pending.post('/api/auth/login').send({ email: 'pending4@example.com', password: 'Password1!' });

    const res = await pending.post('/api/sessions/resolve');
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/session limit still reached/i);
  });

  it('logged-out sessions do not count toward the limit', async () => {
    const { app } = createSharedTestSetup();
    const agents = Array.from({ length: MAX_SESSIONS_PER_USER }, () => request.agent(app));

    await agents[0].post('/api/auth/register').send({ name: 'Revoke', email: 'revoke@example.com', password: 'Password1!' });
    for (let i = 0; i < MAX_SESSIONS_PER_USER; i++) {
      await agents[i].post('/api/auth/login').send({ email: 'revoke@example.com', password: 'Password1!' });
    }
    await agents[MAX_SESSIONS_PER_USER - 1].post('/api/auth/logout');

    const extra = request.agent(app);
    const res = await extra.post('/api/auth/login').send({ email: 'revoke@example.com', password: 'Password1!' });
    expect(res.status).toBe(200);
    expect(res.body.sessionLimited).toBeUndefined();
  });

  it("cannot terminate another user's session", async () => {
    const { app } = createSharedTestSetup();
    const a = request.agent(app);
    const b = request.agent(app);

    expect((await a.post('/api/auth/register').send({ name: 'UserA', email: 'crossterm-a@example.com', password: 'Password1!' })).status).toBe(201);
    expect((await a.post('/api/auth/login').send({ email: 'crossterm-a@example.com', password: 'Password1!' })).status).toBe(200);
    expect((await b.post('/api/auth/register').send({ name: 'UserB', email: 'crossterm-b@example.com', password: 'Password1!' })).status).toBe(201);
    expect((await b.post('/api/auth/login').send({ email: 'crossterm-b@example.com', password: 'Password1!' })).status).toBe(200);

    // Get a's session opaque ID from a's own sessions list
    const aSessionsRes = await a.get('/api/sessions/me');
    expect(aSessionsRes.status).toBe(200);
    expect(aSessionsRes.body.sessions).toHaveLength(1);
    const aSessionOpaqueId = aSessionsRes.body.sessions[0].id;

    // b cannot terminate a's session — must get 404 (not found for b's userId)
    expect((await b.delete(`/api/sessions/${aSessionOpaqueId}`)).status).toBe(404);
  });

  it('marks exactly one session as isCurrent', async () => {
    const { app } = createSharedTestSetup();
    const a1 = request.agent(app);
    const a2 = request.agent(app);

    await a1.post('/api/auth/register').send({ name: 'Current', email: 'current@example.com', password: 'Password1!' });
    await a1.post('/api/auth/login').send({ email: 'current@example.com', password: 'Password1!' });
    await a2.post('/api/auth/login').send({ email: 'current@example.com', password: 'Password1!' });

    const sessions = (await a1.get('/api/sessions/me')).body.sessions;
    expect(sessions.filter((s: { isCurrent: boolean }) => s.isCurrent)).toHaveLength(1);
    expect(sessions.filter((s: { isCurrent: boolean }) => !s.isCurrent)).toHaveLength(1);
  });

  it('unauthenticated request cannot access sessions', async () => {
    expect((await request(createTestApp()).get('/api/sessions')).status).toBe(401);
  });

  it('resolve rejects fully authenticated sessions', async () => {
    const { app } = createSharedTestSetup();
    const a = request.agent(app);
    await a.post('/api/auth/register').send({ name: 'Full', email: 'full@example.com', password: 'Password1!' });
    await a.post('/api/auth/login').send({ email: 'full@example.com', password: 'Password1!' });
    expect((await a.post('/api/sessions/resolve')).status).toBe(401);
  });
});
