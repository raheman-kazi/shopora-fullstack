const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        // =========================================
        // GOOGLE USER INFORMATION
        // =========================================

        const googleId = profile.id;

        const email =
          profile.emails?.[0]?.value?.toLowerCase();

        const name =
          profile.displayName || "Google User";

        if (!email) {
          return done(
            new Error("Google account email not available")
          );
        }

        // =========================================
        // FIND USER BY GOOGLE ID
        // =========================================

        let user = await User.findOne({
          googleId,
        });

        // =========================================
        // IF GOOGLE USER DOES NOT EXIST
        // CHECK EMAIL
        // =========================================

        if (!user) {
          user = await User.findOne({
            email,
          });

          // =========================================
          // EXISTING EMAIL USER
          // LINK GOOGLE ACCOUNT
          // =========================================

          if (user) {
            user.googleId = googleId;

            await user.save();
          }

          // =========================================
          // COMPLETELY NEW USER
          // CREATE ACCOUNT
          // =========================================

          else {
            user = await User.create({
              name,
              email,
              googleId,
              password: null,
              phone: undefined,
              address: "",
            });
          }
        }

        // =========================================
        // RETURN USER
        // =========================================

        return done(null, user);

      } catch (error) {
        console.error(
          "Google Strategy Error:",
          error
        );

        return done(error, null);
      }
    }
  )
);

module.exports = passport;