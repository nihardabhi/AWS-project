import express from "express";
import { getConnection } from "./db.js";
import sql from "mssql";

const router = express.Router();

// ✅ CREATE user
router.post("/users", async (req, res) => {
  try {
    const { FirstName, LastName, Email, Password } = req.body;

    if (!FirstName || !LastName || !Email || !Password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input("FirstName", sql.NVarChar, FirstName)
      .input("LastName", sql.NVarChar, LastName)
      .input("Email", sql.NVarChar, Email)
      .input("Password", sql.NVarChar, Password)
      .query("INSERT INTO UserProfile (FirstName, LastName, Email, Password, CreatedAt) OUTPUT INSERTED.UserId VALUES (@FirstName, @LastName, @Email, @Password, GETDATE())");

    res.status(201).json({ message: "User created", UserId: result.recordset[0].UserId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ READ all users
router.get("/users", async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query("SELECT UserId, FirstName, LastName, Email, CreatedAt FROM UserProfile");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ READ user by ID
router.get("/users/:id", async (req, res) => {
  try {
    const pool = await getConnection();
    const userId = parseInt(req.params.id.trim(), 10);
    if (isNaN(userId)) return res.status(400).json({ message: "Invalid UserId" });

    const result = await pool.request()
      .input("UserId", sql.Int, userId)
      .query("SELECT UserId, FirstName, LastName, Email, CreatedAt FROM UserProfile WHERE UserId=@UserId");

    if (!result.recordset[0]) return res.status(404).json({ message: "User not found" });
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ UPDATE user by ID
router.put("/users/:id", async (req, res) => {
  try {
    const pool = await getConnection();
    const userId = parseInt(req.params.id.trim(), 10);
    if (isNaN(userId)) return res.status(400).json({ message: "Invalid UserId" });

    const { FirstName, LastName, Email, Password } = req.body;
    const result = await pool.request()
      .input("UserId", sql.Int, userId)
      .input("FirstName", sql.NVarChar, FirstName)
      .input("LastName", sql.NVarChar, LastName)
      .input("Email", sql.NVarChar, Email)
      .input("Password", sql.NVarChar, Password)
      .query(`
        UPDATE UserProfile
        SET FirstName=@FirstName, LastName=@LastName, Email=@Email, Password=@Password
        WHERE UserId=@UserId
      `);

    if (result.rowsAffected[0] === 0) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ DELETE user by ID
router.delete("/users/:id", async (req, res) => {
  try {
    const pool = await getConnection();
    const userId = parseInt(req.params.id.trim(), 10);
    if (isNaN(userId)) return res.status(400).json({ message: "Invalid UserId" });

    const result = await pool.request()
      .input("UserId", sql.Int, userId)
      .query("DELETE FROM UserProfile WHERE UserId=@UserId");

    if (result.rowsAffected[0] === 0) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
