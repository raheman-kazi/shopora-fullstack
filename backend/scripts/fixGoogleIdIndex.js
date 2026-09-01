/**
 * googleId: null wale purane documents saaf karta hai.
 *
 * Problem: sparse index sirf MISSING field skip karta hai.
 * null ek value hai, wo index me jaati hai — isliye pure
 * database me sirf EK user googleId: null rakh paata tha,
 * aur doosre register par E11000 duplicate key aata tha.
 *
 * Ye script un documents se googleId field hi hata deti hai.
 *
 * Usage (backend folder se):
 *   node scripts/fixGoogleIdIndex.js
 */

require("dotenv").config();

const mongoose = require("mongoose");

const run = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to database:", conn.connection.name);

    if (conn.connection.name === "test") {
      console.log("");
      console.log("WARNING: database ka naam 'test' hai.");
      console.log("MONGO_URI me DB name missing hai — .net/ ke baad");
      console.log("shopora add karna chahiye.");
      console.log("");
    }

    const users = conn.connection.db.collection("users");

    // 1. null googleId wale docs se field hata do
    const result = await users.updateMany(
      { googleId: null },
      { $unset: { googleId: "" } }
    );

    console.log(
      `Cleaned ${result.modifiedCount} user(s) with googleId: null`
    );

    // 2. Index ko sparse ke saath dobara banao
    try {
      await users.dropIndex("googleId_1");
      console.log("Dropped old googleId index");
    } catch {
      console.log("No googleId index to drop (that's fine)");
    }

    await users.createIndex(
      { googleId: 1 },
      { unique: true, sparse: true }
    );

    console.log("Recreated googleId index as unique + sparse");
    console.log("");
    console.log("Ab register kaam karna chahiye.");

    process.exit(0);
  } catch (error) {
    console.error("Failed:", error.message);
    process.exit(1);
  }
};

run();