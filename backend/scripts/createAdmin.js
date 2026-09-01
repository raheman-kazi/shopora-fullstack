/**
 * Naya admin account seedha banane ke liye.
 * Signup form ki zaroorat nahi.
 *
 * Usage (backend folder se):
 *   node scripts/createAdmin.js admin@shopora.com Admin@123 "Shopora Admin"
 *
 * Agar email pehle se exist karti hai to wo user admin ban jayega
 * aur password bhi naya set ho jayega.
 */

require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const run = async () => {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || "Admin";

  if (!email || !password) {
    console.error(
      'Usage: node scripts/createAdmin.js <email> <password> "<name>"'
    );
    process.exit(1);
  }

  if (password.length < 6) {
    console.error("Password kam se kam 6 characters ka hona chahiye");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);

    const cleanEmail = email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 10);

    const existing = await User.findOne({ email: cleanEmail });

    if (existing) {
      existing.name = name;
      existing.password = hashedPassword;
      existing.role = "admin";
      await existing.save();

      console.log("");
      console.log("Existing user updated to admin.");
      console.log("  Email    :", existing.email);
      console.log("  Password :", password);
      console.log("  Role     :", existing.role);
      console.log("");

      process.exit(0);
    }

    const admin = await User.create({
      name,
      email: cleanEmail,
      password: hashedPassword,
      role: "admin",
      address: "",
    });

    console.log("");
    console.log("Admin account created.");
    console.log("  Email    :", admin.email);
    console.log("  Password :", password);
    console.log("  Role     :", admin.role);
    console.log("");
    console.log("Ab site par isi email/password se login karo.");
    console.log("");

    process.exit(0);
  } catch (error) {
    console.error("Failed:", error.message);
    process.exit(1);
  }
};

run();
