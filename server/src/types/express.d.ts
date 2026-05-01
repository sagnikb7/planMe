import { Types } from 'mongoose';

declare global {
  namespace Express {
    interface User {
      _id: Types.ObjectId;
      name: string;
      email: string;
      authProvider?: 'local' | 'google';
      hasPassword?: boolean;
      createdAt?: Date;
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    pendingUserId?: string;
  }
}
