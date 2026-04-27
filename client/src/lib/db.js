import Dexie from 'dexie';

const db = new Dexie('planme-offline');

db.version(1).stores({
  ideas: '_id, syncStatus, status, updatedAt',
  pendingQueue: '++id, type, ideaId, createdAt',
});

export default db;
