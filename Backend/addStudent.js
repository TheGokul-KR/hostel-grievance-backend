const mongoose = require("mongoose");
const StudentMaster = require("./models/StudentMaster");
require("dotenv").config();

const rawData = `
IGW23CS049, Gokul, daamu444@gmail.com, 210
IGW23CS029, Arjun, c17603312@gmail.com, 210
IGW23CS061, Nikhil, nikhilkrishnan012005@gmail.com, 203
IGW23CS055, Thankappan, terminatoraada@gmail.com, 107
IGW23CS0555, Tester, gkrpes123@gmail., 312
IGW23CS026, Ansil, college24college@gmail.com, 203
`;

const students = rawData
  .trim()
  .split("\n")
  .map(line => {
    const [regNo, name, email, roomNumber] = line.split(",").map(v => v.trim());
    return {
      regNo,
      name,
      email,
      roomNumber,
      activated: false
    };
  });

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    for (const s of students) {
      try {
        await StudentMaster.create(s);
        console.log("INSERTED:", s.regNo);
      } catch (err) {
        console.log("SKIPPED:", s.regNo, "=>", err.message);
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
