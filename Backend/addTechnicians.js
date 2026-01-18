const mongoose = require("mongoose");
const TechnicianMaster = require("./models/TechnicianMaster");
require("dotenv").config();

const rawData = `
TECH01, Arun, arun@gmail.com, Electrical
TECH02, Kumar, kumar@gmail.com, Plumbing
TECH03, Ravi, ravi@gmail.com, Cleaning
TECH04, Suresh, suresh@gmail.com, Furniture
`;

const technicians = rawData
  .trim()
  .split("\n")
  .map(line => {
    const [techId, name, email, department] = line.split(",").map(v => v.trim());
    return {
      techId,
      name,
      email,
      department,
      activated: false
    };
  });

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    for (const t of technicians) {
      try {
        await TechnicianMaster.create(t);
        console.log("INSERTED:", t.techId);
      } catch (err) {
        console.log("SKIPPED:", t.techId, "=>", err.message);
      }
    }

  } catch (err) {
    console.error("DB ERROR:", err.message);
  } finally {
    await mongoose.connection.close();
    console.log("DB closed");
    process.exit();
  }
}

run();
