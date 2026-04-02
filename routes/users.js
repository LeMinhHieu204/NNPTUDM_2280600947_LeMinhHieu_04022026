var express = require("express");
var router = express.Router();
let { validatedResult, CreateUserValidator, ModifyUserValidator } = require("../utils/validator")
let userModel = require("../schemas/users");
let userController = require("../controllers/users");
let roleModel = require("../schemas/roles");
const { checkLogin,checkRole } = require("../utils/authHandler");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { sendUserPasswordMail } = require("../utils/mailHandler");

function generateRandomPassword(length = 16) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.randomBytes(length);
  let password = "";

  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }

  return password;
}

router.get("/", checkLogin,checkRole("ADMIN","MODERATOR"), async function (req, res, next) {
  let users = await userModel
    .find({ isDeleted: false })
  res.send(users);
});

router.get("/:id", async function (req, res, next) {
  try {
    let result = await userModel
      .find({ _id: req.params.id, isDeleted: false })
    if (result.length > 0) {
      res.send(result);
    }
    else {
      res.status(404).send({ message: "id not found" });
    }
  } catch (error) {
    res.status(404).send({ message: "id not found" });
  }
});

router.post("/", CreateUserValidator, validatedResult, async function (req, res, next) {
  try {
    let newUser = await userController.CreateAnUser(
      req.body.username,
      req.body.password,
      req.body.email,
      req.body.role,
      null,
      req.body.fullname,
      req.body.avatarUrl,
      req.body.status,
      req.body.loginCount
    )
    res.send(newUser);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.post("/import", checkLogin, checkRole("ADMIN", "MODERATOR"), async function (req, res, next) {
  try {
    const filePath = req.body.filePath
      ? path.resolve(req.body.filePath)
      : path.join(process.cwd(), "user.xlsx");

    if (!fs.existsSync(filePath)) {
      return res.status(404).send({ message: "khong tim thay file user.xlsx" });
    }

    const roleUser = await roleModel.findOne({
      name: { $regex: /^user$/i },
      isDeleted: false
    });

    const importRole = roleUser || {
      id: "r3",
      name: "user",
      description: "Nguoi dung thuong"
    };

    const workbook = XLSX.readFile(filePath);
    const firstSheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
      defval: ""
    });

    const result = {
      total: rows.length,
      created: 0,
      skipped: 0,
      failed: 0,
      details: []
    };

    for (const row of rows) {
      const username = String(row.username || "").trim();
      const email = String(row.email || "").trim().toLowerCase();

      if (!username || !email) {
        result.skipped++;
        result.details.push({
          username,
          email,
          status: "skipped",
          reason: "thieu username hoac email"
        });
        continue;
      }

      const userExists = await userModel.findOne({
        $or: [{ username }, { email }],
        isDeleted: false
      });

      if (userExists) {
        result.skipped++;
        result.details.push({
          username,
          email,
          status: "skipped",
          reason: "username hoac email da ton tai"
        });
        continue;
      }

      const password = generateRandomPassword(16);

      try {
        await userController.CreateAnUser(
          username,
          password,
          email,
          roleUser ? roleUser._id : importRole,
          null,
          "",
          undefined,
          true,
          0
        );

        let mailStatus = "sent";
        let mailError = null;

        try {
          await sendUserPasswordMail(email, username, password);
        } catch (error) {
          mailStatus = "failed";
          mailError = error.message;
        }

        result.created++;
        result.details.push({
          username,
          email,
          status: "created",
          mailStatus,
          mailError
        });
      } catch (error) {
        result.failed++;
        result.details.push({
          username,
          email,
          status: "failed",
          reason: error.message
        });
      }
    }

    res.send(result);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.put("/:id", ModifyUserValidator, validatedResult, async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedItem) return res.status(404).send({ message: "id not found" });

    let populated = await userModel
      .findById(updatedItem._id)
    res.send(populated);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.delete("/:id", async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    if (!updatedItem) {
      return res.status(404).send({ message: "id not found" });
    }
    res.send(updatedItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;
