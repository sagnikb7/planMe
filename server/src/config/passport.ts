import { PassportStatic } from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/user.model';

export function configurePassport(passport: PassportStatic): void {
  passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const user = await UserModel.findOne({ email: email.toLowerCase().trim() }).lean();
      if (!user) return done(null, false, { message: 'Invalid email or password' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return done(null, false, { message: 'Invalid email or password' });

      return done(null, user as Express.User);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user, done) => done(null, (user as Express.User)._id));

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await UserModel.findById(id).lean();
      done(null, user as Express.User);
    } catch (err) {
      done(err);
    }
  });
}
