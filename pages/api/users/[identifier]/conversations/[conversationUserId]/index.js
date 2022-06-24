import dbConnect from "../../../../../../lib/dbConnect";
import User from "../../../../../../models/User";
import Message from "../../../../../../models/Message";

/* TODO: Throw error if we try to have a conversation with ourselves */

/* We fetch the converstaion with a specific user */
const handler = async (req, res) => {
  // Would use SEARCH method if supported (correct verb)
  const {
    identifier: username,
    conversationUserId,
    fromDate,
    amount,
  } = req.query;
  if (req.method !== "POST") {
    res.status(400).json({ message: "Invalid Request." });
    return;
  }
  const { usedIds } = req.body;

  if (!username.trim()) {
    res.status(400).json({ message: "Invalid Request." });
    return;
  }

  await dbConnect();
  // See if users exists
  let existingUser, conversationUser;
  try {
    [existingUser, conversationUser] = await Promise.all([
      User.findOne({ username: username }),
      User.findById(conversationUserId),
    ]);
    if (!existingUser || !conversationUser) {
      res.status(404).json({ message: "User does not exist." });
      return;
    }
  } catch (err) {
    res.status(500).json({
      message: "A problem has occurred while fetching users.",
      err: err,
    });
  }

  try {
    // Fetch the latest messages first
    const foundMessages = await Message.find({
      _id: { $nin: usedIds },
      date: { $lt: fromDate },
      $or: [
        { recieverId: conversationUserId },
        { senderId: conversationUserId },
      ],
    })
      .sort({ date: "-1" })
      .limit(amount);
    const newUsedMessageIds = foundMessages.map((message) => message._id);

    res.status(200).json({
      message: "Successfully found users we had a conversation with.",
      newData: foundMessages,
      newIds: newUsedMessageIds,
    });
  } catch (err) {
    res.status(500).json({
      message: "A problem has occurred while fetching conversation messages.",
      err: err,
    });
  }
};

export default handler;