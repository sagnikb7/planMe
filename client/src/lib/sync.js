import api from './api';
import db from './db';

export async function seedCache(serverIdeas) {
  const synced = serverIdeas.map((idea) => ({ ...idea, syncStatus: 'synced' }));
  const pending = await db.ideas
    .where('syncStatus')
    .notEqual('synced')
    .toArray();
  const pendingIds = new Set(pending.map((i) => i._id));
  const toUpsert = synced.filter((i) => !pendingIds.has(i._id));
  await db.ideas.bulkPut(toUpsert);
}

let activeFlush = null;

export function flushPendingQueue() {
  if (activeFlush) return activeFlush;
  activeFlush = _flushPendingQueue().finally(() => { activeFlush = null; });
  return activeFlush;
}

async function _flushPendingQueue() {
  const queue = await db.pendingQueue.orderBy('createdAt').toArray();
  let synced = 0;

  for (const op of queue) {
    try {
      if (op.type === 'pending-create') {
        const { data } = await api.post('/ideas', op.payload);
        await db.ideas.delete(op.ideaId);
        await db.ideas.put({ ...data, syncStatus: 'synced' });
      } else if (op.type === 'pending-update') {
        const { data } = await api.put(`/ideas/${op.ideaId}`, op.payload);
        await db.ideas.put({ ...data, syncStatus: 'synced' });
      } else if (op.type === 'pending-archive') {
        const { data } = await api.patch(`/ideas/${op.ideaId}/status`, { status: op.status });
        await db.ideas.put({ ...data, syncStatus: 'synced' });
      } else if (op.type === 'pending-delete') {
        await api.delete(`/ideas/${op.ideaId}`);
        await db.ideas.delete(op.ideaId);
      }
      await db.pendingQueue.delete(op.id);
      synced++;
    } catch (err) {
      if (err.response?.status === 404) {
        await db.pendingQueue.delete(op.id);
        await db.ideas.delete(op.ideaId).catch(() => {});
        synced++;
        continue;
      }
      break;
    }
  }

  return synced;
}

export function isOfflineError(err) {
  return !!(err?.isOffline || err?.code === 'ECONNABORTED' || err?.message === 'Network Error');
}
