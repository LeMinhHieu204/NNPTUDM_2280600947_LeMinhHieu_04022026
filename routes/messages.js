var express = require("express");
var router = express.Router();
const mongoose = require("mongoose");
const { checkLogin } = require("../utils/authHandler");
const messageModel = require("../schemas/messages");
const userModel = require("../schemas/users");

router.get("/", checkLogin, async function (req, res, next) {
  try {
    const currentUserId = req.user._id.toString();

    const conversations = await messageModel.aggregate([
      {
        $match: {
          $or: [
            { from: req.user._id },
            { to: req.user._id }
          ]
        }
      },
      {
        $addFields: {
          userA: {
            $cond: [
              { $lt: [{ $toString: "$from" }, { $toString: "$to" }] },
              "$from",
              "$to"
            ]
          },
          userB: {
            $cond: [
              { $lt: [{ $toString: "$from" }, { $toString: "$to" }] },
              "$to",
              "$from"
            ]
          }
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            userA: "$userA",
            userB: "$userB"
          },
          lastMessage: { $first: "$$ROOT" }
        }
      },
      { $replaceRoot: { newRoot: "$lastMessage" } },
      { $sort: { createdAt: -1 } }
    ]);

    const userIds = [
      ...new Set(
        conversations.map(function (item) {
          const fromId = item.from.toString();
          const toId = item.to.toString();
          return fromId === currentUserId ? toId : fromId;
        })
      )
    ];

    const users = await userModel.find({
      _id: { $in: userIds },
      isDeleted: false
    });

    const userMap = new Map(
      users.map(function (user) {
        return [user._id.toString(), user];
      })
    );

    const result = conversations.map(function (item) {
      const fromId = item.from.toString();
      const toId = item.to.toString();
      const partnerId = fromId === currentUserId ? toId : fromId;

      return {
        user: userMap.get(partnerId) || null,
        message: item
      };
    });

    res.send(result);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.get("/:userID", checkLogin, async function (req, res, next) {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.userID;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(404).send({ message: "user khong ton tai" });
    }

    const messages = await messageModel
      .find({
        $or: [
          { from: currentUserId, to: targetUserId },
          { from: targetUserId, to: currentUserId }
        ]
      })
      .sort({ createdAt: 1 });

    res.send(messages);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.post("/", checkLogin, async function (req, res, next) {
  try {
    const currentUserId = req.user._id;
    const { to, messageContent } = req.body;

    if (!mongoose.Types.ObjectId.isValid(to)) {
      return res.status(404).send({ message: "user nhan khong ton tai" });
    }

    if (!messageContent || !["file", "text"].includes(messageContent.type)) {
      return res.status(400).send({ message: "messageContent.type phai la file hoac text" });
    }

    if (!messageContent.text || !String(messageContent.text).trim()) {
      return res.status(400).send({ message: "messageContent.text khong duoc rong" });
    }

    const receiveUser = await userModel.findOne({
      _id: to,
      isDeleted: false
    });

    if (!receiveUser) {
      return res.status(404).send({ message: "user nhan khong ton tai" });
    }

    const newMessage = new messageModel({
      from: currentUserId,
      to: to,
      messageContent: {
        type: messageContent.type,
        text: String(messageContent.text).trim()
      }
    });

    await newMessage.save();
    res.send(newMessage);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

module.exports = router;
