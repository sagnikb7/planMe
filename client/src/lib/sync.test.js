import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from './api';
import db from './db';
import { isOfflineError, seedCache, flushPendingQueue } from './sync';

beforeEach(async () => {
  vi.clearAllMocks();
  await db.ideas.clear();
  await db.pendingQueue.clear();
});

// ─── isOfflineError ──────────────────────────────────────────────────────────

describe('isOfflineError', () => {
  it('returns true when isOffline flag is set', () => {
    expect(isOfflineError({ isOffline: true })).toBe(true);
  });

  it('returns true for ECONNABORTED (axios timeout)', () => {
    expect(isOfflineError({ code: 'ECONNABORTED' })).toBe(true);
  });

  it('returns true for Network Error message', () => {
    expect(isOfflineError({ message: 'Network Error' })).toBe(true);
  });

  it('returns false for server errors that have a response', () => {
    expect(isOfflineError({ response: { status: 500 }, message: 'Internal Server Error' })).toBe(false);
    expect(isOfflineError({ response: { status: 404 } })).toBe(false);
  });

  it('returns false for null or undefined', () => {
    expect(isOfflineError(null)).toBe(false);
    expect(isOfflineError(undefined)).toBe(false);
  });

  it('returns true for ERR_NETWORK code', () => {
    expect(isOfflineError({ code: 'ERR_NETWORK' })).toBe(true);
  });
});

// ─── seedCache ───────────────────────────────────────────────────────────────

describe('seedCache', () => {
  const makeIdea = (id, extra = {}) => ({
    _id: id,
    title: 'Test',
    details: '',
    tags: [],
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...extra,
  });

  it('stores server ideas with syncStatus synced', async () => {
    await seedCache([makeIdea('server1')]);
    const stored = await db.ideas.get('server1');
    expect(stored.syncStatus).toBe('synced');
    expect(stored.title).toBe('Test');
  });

  it('upserts multiple ideas in one call', async () => {
    await seedCache([makeIdea('s1'), makeIdea('s2'), makeIdea('s3')]);
    expect(await db.ideas.count()).toBe(3);
  });

  it('does not overwrite pending-create ideas', async () => {
    await db.ideas.put({ _id: 'local_abc', title: 'Local draft', syncStatus: 'pending-create' });
    await seedCache([makeIdea('local_abc', { title: 'Should not win' })]);
    const stored = await db.ideas.get('local_abc');
    expect(stored.syncStatus).toBe('pending-create');
    expect(stored.title).toBe('Local draft');
  });

  it('does not overwrite pending-update ideas', async () => {
    await db.ideas.put({ _id: 'server2', title: 'Edited offline', syncStatus: 'pending-update' });
    await seedCache([makeIdea('server2', { title: 'Server version' })]);
    const stored = await db.ideas.get('server2');
    expect(stored.syncStatus).toBe('pending-update');
    expect(stored.title).toBe('Edited offline');
  });

  it('does not overwrite pending-archive ideas', async () => {
    await db.ideas.put({ _id: 'server3', status: 'archived', syncStatus: 'pending-archive' });
    await seedCache([makeIdea('server3', { status: 'draft' })]);
    const stored = await db.ideas.get('server3');
    expect(stored.syncStatus).toBe('pending-archive');
    expect(stored.status).toBe('archived');
  });

  it('handles an empty array without error', async () => {
    await expect(seedCache([])).resolves.toBeUndefined();
    expect(await db.ideas.count()).toBe(0);
  });

  it('does not overwrite pending-delete ideas', async () => {
    await db.ideas.put({ _id: 'server4', title: 'About to die', syncStatus: 'pending-delete' });
    await seedCache([makeIdea('server4', { title: 'Server version' })]);
    const stored = await db.ideas.get('server4');
    expect(stored.syncStatus).toBe('pending-delete');
    expect(stored.title).toBe('About to die');
  });
});

// ─── flushPendingQueue ───────────────────────────────────────────────────────

describe('flushPendingQueue', () => {
  const serverIdea = (id, extra = {}) => ({
    _id: id,
    title: 'Synced',
    details: '',
    tags: [],
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...extra,
  });

  it('returns 0 and makes no API calls when the queue is empty', async () => {
    const count = await flushPendingQueue();
    expect(count).toBe(0);
    expect(api.post).not.toHaveBeenCalled();
  });

  it('pending-create: POSTs to server, replaces local idea with server version', async () => {
    const tempId = 'local_test1';
    const payload = { title: 'New idea', details: '<p>Hi</p>', tags: ['foo'], status: 'draft' };
    await db.ideas.put({ _id: tempId, ...payload, syncStatus: 'pending-create' });
    await db.pendingQueue.add({ type: 'pending-create', ideaId: tempId, payload, createdAt: new Date().toISOString() });

    api.post.mockResolvedValue({ data: serverIdea('server99', { title: 'New idea' }) });

    const count = await flushPendingQueue();

    expect(count).toBe(1);
    expect(api.post).toHaveBeenCalledWith('/ideas', payload);
    expect(await db.ideas.get(tempId)).toBeUndefined();
    const synced = await db.ideas.get('server99');
    expect(synced).toBeDefined();
    expect(synced.syncStatus).toBe('synced');
    expect(await db.pendingQueue.count()).toBe(0);
  });

  it('pending-update: PUTs to server and updates local idea', async () => {
    const payload = { title: 'Updated', details: '', tags: [], status: 'draft' };
    await db.ideas.put({ _id: 'real1', title: 'Old', syncStatus: 'pending-update' });
    await db.pendingQueue.add({ type: 'pending-update', ideaId: 'real1', payload, createdAt: new Date().toISOString() });

    api.put.mockResolvedValue({ data: serverIdea('real1', { title: 'Updated' }) });

    await flushPendingQueue();

    expect(api.put).toHaveBeenCalledWith('/ideas/real1', payload);
    const updated = await db.ideas.get('real1');
    expect(updated.syncStatus).toBe('synced');
    expect(updated.title).toBe('Updated');
  });

  it('pending-archive: PATCHes status on server', async () => {
    await db.ideas.put({ _id: 'real2', status: 'draft', syncStatus: 'pending-archive' });
    await db.pendingQueue.add({ type: 'pending-archive', ideaId: 'real2', status: 'archived', createdAt: new Date().toISOString() });

    api.patch.mockResolvedValue({ data: serverIdea('real2', { status: 'archived' }) });

    await flushPendingQueue();

    expect(api.patch).toHaveBeenCalledWith('/ideas/real2/status', { status: 'archived' });
    const updated = await db.ideas.get('real2');
    expect(updated.status).toBe('archived');
    expect(updated.syncStatus).toBe('synced');
  });

  it('pending-delete: DELETEs from server and removes from db', async () => {
    await db.ideas.put({ _id: 'real3', syncStatus: 'pending-delete' });
    await db.pendingQueue.add({ type: 'pending-delete', ideaId: 'real3', createdAt: new Date().toISOString() });

    api.delete.mockResolvedValue({});

    await flushPendingQueue();

    expect(api.delete).toHaveBeenCalledWith('/ideas/real3');
    expect(await db.ideas.get('real3')).toBeUndefined();
    expect(await db.pendingQueue.count()).toBe(0);
  });

  it('404 response: skips op silently, continues processing remaining ops', async () => {
    const t1 = new Date(Date.now() - 2000).toISOString();
    const t2 = new Date(Date.now() - 1000).toISOString();
    await db.ideas.put({ _id: 'gone', syncStatus: 'pending-update' });
    await db.ideas.put({ _id: 'fine', syncStatus: 'pending-update' });
    await db.pendingQueue.add({ type: 'pending-update', ideaId: 'gone', payload: {}, createdAt: t1 });
    await db.pendingQueue.add({ type: 'pending-update', ideaId: 'fine', payload: { title: 'Fine', details: '', tags: [], status: 'draft' }, createdAt: t2 });

    const notFound = Object.assign(new Error('Not found'), { response: { status: 404 } });
    api.put.mockRejectedValueOnce(notFound).mockResolvedValueOnce({ data: serverIdea('fine') });

    const count = await flushPendingQueue();

    expect(count).toBe(2);
    expect(await db.pendingQueue.count()).toBe(0);
  });

  it('network error: stops processing immediately and preserves all remaining ops', async () => {
    const t1 = new Date(Date.now() - 2000).toISOString();
    const t2 = new Date(Date.now() - 1000).toISOString();
    await db.ideas.put({ _id: 'a1', syncStatus: 'pending-update' });
    await db.ideas.put({ _id: 'a2', syncStatus: 'pending-update' });
    await db.pendingQueue.add({ type: 'pending-update', ideaId: 'a1', payload: {}, createdAt: t1 });
    await db.pendingQueue.add({ type: 'pending-update', ideaId: 'a2', payload: {}, createdAt: t2 });

    api.put.mockRejectedValue(Object.assign(new Error('offline'), { isOffline: true }));

    const count = await flushPendingQueue();

    expect(count).toBe(0);
    expect(await db.pendingQueue.count()).toBe(2);
  });

  it('processes ops in chronological order', async () => {
    const order = [];
    const t1 = new Date(Date.now() - 2000).toISOString();
    const t2 = new Date(Date.now() - 1000).toISOString();

    await db.ideas.put({ _id: 'first', syncStatus: 'pending-update' });
    await db.ideas.put({ _id: 'second', syncStatus: 'pending-update' });
    await db.pendingQueue.add({ type: 'pending-update', ideaId: 'first', payload: {}, createdAt: t1 });
    await db.pendingQueue.add({ type: 'pending-update', ideaId: 'second', payload: {}, createdAt: t2 });

    api.put.mockImplementation(async (url) => {
      order.push(url);
      return { data: serverIdea(url.split('/').pop()) };
    });

    await flushPendingQueue();

    expect(order[0]).toBe('/ideas/first');
    expect(order[1]).toBe('/ideas/second');
  });
});
