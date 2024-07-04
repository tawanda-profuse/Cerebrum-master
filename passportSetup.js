const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const bcrypt = require('bcrypt');
const UserModel = require('./models/User.schema');

passport.use(
    new LocalStrategy({ usernameField: 'email' }, async function (
        email,
        password,
        done
    ) {
        try {
            let user = await UserModel.findOne(email);

            if (!user) {
                return done(null, false); // User not found
            }
            const matchPassword = await bcrypt.compare(password, user.password);
            if (!matchPassword) {
                return done(null, false); // Password does not match
            }
            return done(null, user); // Successful authentication
        } catch (err) {
            return done(err); // Handle error
        }
    })
);

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/users/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let users = await UserModel.getAllUsers();
                let user = users.find(
                    (user) =>
                        user.googleId ===
                        `google_${profile.id}_googleIdSignature`
                );
                if (!user) {
                    user = {
                        id: Date.now().toString(),
                        googleId: `google_${profile.id}_googleIdSignature`,
                        password: await bcrypt.hash(
                            `google_${profile.id}_googleIdSignature`,
                            10
                        ),
                        email: profile.emails[0].value,
                        name: profile.displayName,
                        subscriptions: [
                            {
                                amount: 5,
                                tokenCount: 0,
                                orderId: '',
                                id: Date.now().toString(),
                                createdAt: new Date().toISOString(),
                                updatedAt: [new Date().toISOString()],
                            },
                        ],
                    };
                    await UserModel.addUser(user);
                }
                done(null, user);
            } catch (error) {
                done(error, null);
            }
        }
    )
);

passport.use(
    new MicrosoftStrategy(
        {
            clientID: process.env.MICROSOFT_CLIENT_ID,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
            callbackURL: '/users/microsoft/callback',
            scope: ['user.read'],
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let users = await UserModel.getAllUsers();
                let user = users.find(
                    (user) =>
                        user.microsoftId ===
                        `microsoft_${profile.id}_microsoftIdSignature`
                );
                if (!user) {
                    user = {
                        id: Date.now().toString(),
                        microsoftId: `microsoft_${profile.id}_microsoftIdSignature`,
                        password: await bcrypt.hash(
                            `microsoft_${profile.id}_microsoftIdSignature`,
                            10
                        ),
                        email: profile.emails[0].value,
                        name: profile.displayName,
                        subscriptions: [
                            {
                                amount: 5,
                                tokenCount: 0,
                                orderId: '',
                                id: Date.now().toString(),
                                createdAt: new Date().toISOString(),
                                updatedAt: [new Date().toISOString()],
                            },
                        ],
                    };
                    await UserModel.addUser(user);
                }
                done(null, user);
            } catch (error) {
                done(error, null);
            }
        }
    )
);

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
    await UserModel.findById(id, function (err, user) {
        done(err, user);
    });
});

module.exports = passport;
