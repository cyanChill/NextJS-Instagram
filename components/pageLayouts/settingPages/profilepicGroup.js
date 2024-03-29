import { useState, useEffect, useRef } from "react";

import global from "../../../global";
import { isImage, validImageSize } from "../../../lib/validate";
import Button from "../../formElements/button";
import LoadImage from "../../ui/loadImage/loadImage";
import classes from "./profilepicGroup.module.css";

const maxSizeMB = +process.env.NEXT_PUBLIC_MAX_IMG_MB;

const ProfilePicGroup = ({ userData: { profilePic, name } }) => {
  const imgInputRef = useRef(null);
  const [imageUpload, setImageUpload] = useState(null);
  const [currImg, setCurrImg] = useState(profilePic);

  /* Handles when we want to set a new profile picture */
  useEffect(() => {
    if (imageUpload == null || !isImage(imageUpload)) return;

    /* Validate Upload Image is <{maxSizeMB}MB in size */
    if (!validImageSize(imageUpload.size, maxSizeMB)) {
      setImageUpload(null);
      global.alerts.actions.addAlert({
        type: global.alerts.types.error,
        content: `Image must be <${maxSizeMB}MB in size.`,
      });
      return;
    }

    const setNewProfilePic = async () => {
      // Final validation
      if (imageUpload == null || !isImage(imageUpload)) {
        global.alerts.actions.addAlert({
          type: global.alerts.types.error,
          content: "There was a problem with the selected image.",
        });
        return;
      }

      // Data we'll pass to backend
      const formData = new FormData();
      formData.append("action", "SET");
      formData.append("uploadedImg", imageUpload);

      const route = "/api/account/update-pic";

      const res = await fetch(route, { method: "PATCH", body: formData });
      const data = await res.json();

      if (!res.ok) {
        global.alerts.actions.addAlert({
          type: global.alerts.types.error,
          content: `Failed to update profile picture [${data.message}]`,
        });
        return;
      }

      setCurrImg(data.newProfilePic);

      global.alerts.actions.addAlert({
        type: global.alerts.types.success,
        content: "Successfully updated profile picture.",
      });
      setImageUpload(null);
    };

    setNewProfilePic();
  }, [imageUpload]);

  const removeProfilePic = async () => {
    // Data we'll pass to backend
    const formData = new FormData();
    formData.append("action", "REMOVE");

    const route = "/api/account/update-pic";

    const res = await fetch(route, { method: "PATCH", body: formData });
    const data = await res.json();

    if (!res.ok) {
      global.alerts.actions.addAlert({
        type: global.alerts.types.error,
        content: "Failed to remove profile picture.",
      });
      return;
    }

    setCurrImg(data.newProfilePic);

    global.alerts.actions.addAlert({
      type: global.alerts.types.success,
      content: "Successfully removed profile picture.",
    });
  };

  return (
    <>
      <h2>Update Profile Picture Settings</h2>
      <div className={classes.profileContainer}>
        <div className={classes.imgContainer}>
          <LoadImage
            src={currImg.url}
            alt={`${name}'s profile pic`}
            layout="responsive"
            width="500"
            height="500"
            priority
          />
        </div>

        <div className={classes.profileActions}>
          <Button onClick={() => imgInputRef.current.click()}>
            Set New Profile Picture
          </Button>
          <input
            type="file"
            accept="image/jpeg, image/png, image/jpg"
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files.length === 0) return;
              if (isImage(e.target.files[0])) {
                setImageUpload(e.target.files[0]);
              }
            }}
            ref={imgInputRef}
          />
          <Button
            variant="error"
            onClick={removeProfilePic}
            disabled={currImg.identifier === "default_profile_picture"}
          >
            Remove Profile Picture
          </Button>
        </div>
      </div>
    </>
  );
};

export default ProfilePicGroup;
