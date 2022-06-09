import { AiOutlineShareAlt } from "react-icons/ai";

import classes from "./sharepostbtn.module.css";

const SharePostBtn = ({ postId, children }) => {
  const sendToClipboard = () => {
    navigator.clipboard.writeText(
      `${process.env.NEXT_PUBLIC_BASE_URL}/p/${postId}`
    );
    /* Display mini alert saying we've copied link to clipboard or some animation */
    console.log("Copied post link to clipboard");
  };

  return (
    <div onClick={sendToClipboard} className={classes.wrapper}>
      <AiOutlineShareAlt />
      {children}
    </div>
  );
};

export default SharePostBtn;