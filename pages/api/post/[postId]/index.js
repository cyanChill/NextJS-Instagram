/* 
  Expect either a GET, and DELETE request [maybe patch but only to
  edit description]
*/

import dbConnect from "../../../../lib/dbConnect";
import User from "../../../../models/User";
import Post from "../../../../models/Post";
import Like from "../../../../models/Like";
import Comment from "../../../../models/Comment";

const handler = async (req, res) => {
  const method = req.method;
  const { postId } = req.query;

  await dbConnect();

  const postInfo = await Post.findById(postId);
  if (!postInfo) {
    res.status(404).json({ message: "Post does not exist." });
    return;
  }

  /* TODO: Minimize data fetched? */
  switch (method) {
    case "GET":
      /* Get info on the poster */
      const posterInfo = await User.findById(postInfo.posterId);

      const postLikes = await Like.find({ postId: postInfo._id });
      const postComments = await Comment.find({ postId: postInfo._id });

      /* Fetch remaining info for comments (commenter data) */
      const informizeComments = async (comment) => {
        let commenterInfo;
        try {
          commenterInfo = await User.find({ _id: comment.commenterId });
        } catch (err) {
          return Promise.reject(err);
        }

        return Promise.resolve({
          ...comment._doc,
          commenterInfo,
        });
      };

      const promises = postComments.map((comment) =>
        informizeComments(comment)
      );

      return Promise.all(promises)
        .then((commentsData) => {
          res.status(200).json({
            message: "Successfully obtained post data.",
            post: {
              ...postInfo._doc,
              posterInfo,
              likes: postLikes,
              comments: commentsData,
            },
          });
        })
        .catch((err) => {
          res.status(500).json({
            message:
              "A problem has occurred while fetching commenter data for comment",
            errMsg: err,
          });
        });
    case "DELETE":
      return;
  }
};

export default handler;