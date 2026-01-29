// backend/config/googleAuth.js
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/userModel.js';

const configureGoogleAuth = () => {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL,
                scope: ['profile', 'email']
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Extract user info from Google profile
                    const email = profile.emails[0].value;
                    const name = profile.displayName;
                    const googleId = profile.id;

                    // Check if user already exists
                    let user = await User.findOne({ email: email.toLowerCase() });

                    if (user) {
                        // User exists - update Google ID if not set
                        if (!user.googleId) {
                            user.googleId = googleId;
                            user.isVerified = true; // Auto-verify Google users
                            await user.save();
                        }
                        
                        // Update last login
                        user.lastLogin = new Date();
                        await user.save();
                        
                        return done(null, user);
                    }

                    // User doesn't exist - create new user
                    user = await User.create({
                        name: name.trim(),
                        email: email.toLowerCase().trim(),
                        googleId: googleId,
                        password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8), // Random password (won't be used)
                        isVerified: true, // Auto-verify Google users
                        isActive: true,
                        lastLogin: new Date()
                    });

                    return done(null, user);
                } catch (error) {
                    console.error('Google OAuth error:', error);
                    return done(error, null);
                }
            }
        )
    );

    // Serialize user for session
    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id).select('-password');
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });
};

export default configureGoogleAuth;