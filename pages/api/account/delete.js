import { getSession } from "next-auth/react";

import { auth, bucket } from "../../../firebaseAdmin.config";
import dbConnect from "../../../lib/dbConnect";
import Comment from "../../../models/Comment";
import Follower from "../../../models/Follower";
import Like from "../../../models/Like";
import Post from "../../../models/Post";
import User from "../../../models/User";

const handler = async (req, res) => {
  if (req.method !== "DELETE") {
    res.status(400).json({ message: "Invalid Request." });
    return;
  }

  const session = await getSession({ req: req });
  if (!session) {
    res.status(401).json({ message: "User is not authenticated." });
    return;
  }
  const userId = session.user.dbId;

  await dbConnect();

  /* Get all of our posts */
  const ourPosts = await Post.find({ posterId: userId });

  const deletePostData = async (postId) => {
    try {
      /* Delete all likes & comments for the post and the post itself*/
      await Promise.all([
        Like.deleteMany({ postId: postId }),
        Comment.deleteMany({ postId: postId }),
        Post.findByIdAndDelete(postId),
      ]);
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const postDeletionPromises = ourPosts.map((post) => {
    deletePostData(post._id);
  });

  try {
    /* 
      - Delete all post data (their comments & likes & post itself)
      - Removing all follows of people we're following and all followers
      - Remove all of our likes & comments
      - Delete the folder containing all of our images for this user
      - Delete user's firebase account
      - Delete our user data
    */
    await Promise.all([
      ...postDeletionPromises,
      Follower.deleteMany({
        $or: [{ followerId: userId }, { followingId: userId }],
      }),
      Like.deleteMany({ likerId: userId }),
      Comment.deleteMany({ commenterId: userId }),
      bucket.deleteFiles({ prefix: `${userId}/` }),
      auth.deleteUser(userId),
      User.findByIdAndDelete(userId),
    ]);

    res.status(200).json({ message: "User successfully deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete user data.", err: err });
    return;
  }
};

export default handler;
