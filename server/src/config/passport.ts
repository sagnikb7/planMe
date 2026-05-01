import { PassportStatic } from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/user.model';
import { userRepository } from '../repositories/user.repository';
import { env } from './env';

export function configurePassport(passport: PassportStatic): void {
  if (env.auth.localEnabled) {
    passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        const user = await UserModel.findOne({ email: email.toLowerCase().trim() }).lean();
        if (!user) return done(null, false, { message: 'Invalid email or password' });

        if (!user.password) return done(null, false, { message: 'Invalid email or password' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return done(null, false, { message: 'Invalid email or password' });

        return done(null, user as Express.User);
      } catch (err) {
        return done(err);
      }
    }));
  }

  if (env.auth.googleEnabled) {
    passport.use(new GoogleStrategy({
      clientID:     env.google.clientId,
      clientSecret: env.google.clientSecret,
      callbackURL:  env.google.callbackUrl,
    }, async (_accessToken, _refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email    = profile.emails?.[0]?.value;
        const name     = profile.displayName;
        if (!email) return done(null, false);

        const byGoogleId = await userRepository.findByGoogleId(googleId);
        if (byGoogleId) return done(null, byGoogleId as Express.User);

        const byEmail = await userRepository.findByEmail(email);
        if (byEmail) {
          await userRepository.attachGoogleId(String(byEmail._id), googleId);
          const updated = await userRepository.findById(String(byEmail._id));
          return done(null, updated as Express.User);
        }

        const newUser = await userRepository.createGoogleUser({ name, email, googleId });
        return done(null, newUser as Express.User);
      } catch (err) {
        return done(err as Error);
      }
    }));
  }

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
