/**
 * Kisi existing user ko admin banane ke liye.
 *
 * Usage (backend folder ke andar se):
 *   node scripts/makeAdmin.js you@example.com
 *
 * Wapas normal user banana ho to:
 *   node scripts/makeAdmin.js you@example.com user
 */

require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");

const run = async () => {
  const email = process.argv[2];
  const role = process.argv[3] || "admin";

  if (!email) {
    console.error("Email required. Example: node scripts/makeAdmin.js you@example.com");
    process.exit(1);
  }

  if (!["user", "admin"].includes(role)) {
    console.error("Role must be 'user' or 'admin'");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);

    const user = await User.findOneAndUpdate(
      { email: email.trim().toLowerCase() },
      { role },
      { new: true }
    );

    if (!user) {
      console.error(`No user found with email ${email}`);
      process.exit(1);
    }

    console.log(`${user.name} (${user.email}) is now: ${user.role}`);
    process.exit(0);
  } catch (error) {
    console.error("Failed:", error.message);
    process.exit(1);
  }
};

run();
