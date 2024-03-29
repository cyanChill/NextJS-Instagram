import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { MdOutlineArrowBack, MdClose } from "react-icons/md";

import { followConversion } from "../../../lib/conversions";
import useLazyFetch from "../../../hooks/useLazyFetch";
import Modal from "../../ui/modal/modal";
import UserList from "../../users/userList/userList";
import Button from "../../formElements/button";
import FollowButton from "../../users/followBtn/followBtn";
import PostGrid from "../../posts/postGrid/postGrid";
import TextBreaker from "../../ui/textBreaker/textBreaker";
import LoadImage from "../../ui/loadImage/loadImage";
import LoadingSpinner from "../../ui/spinners/loadingSpinner";
import classes from "./profile.module.css";

const DEFAULT_LIST = { mutual: [], acquaintances: [] };
const FETCH_AMOUNT = 9;

const Profile = ({
  userData,
  ownProfile,
  viewerIsFollowing,
  followerCnt: erCnt,
  followingCnt: ingCnt,
  viewerInfo,
}) => {
  const router = useRouter();

  const { user, postCnt } = userData;

  const [followerCnt, setFollowerCnt] = useState();
  const [followingCnt, setFollowingCnt] = useState();
  const [followerList, setFollowerList] = useState(DEFAULT_LIST);
  const [followingList, setFollowingList] = useState(DEFAULT_LIST);

  const [modalTab, setModalTab] = useState(null);
  const [modalActive, setModalActive] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    /* 
      If we only used useState, then if goto our profile after looking at
      someone else's profile page, we'll have the same followerCnt value
    */
    setFollowerList(DEFAULT_LIST);
    setFollowingList(DEFAULT_LIST);
    setModalTab(null);
    setModalLoading(false);
    setModalActive(false);
    setFollowerCnt(erCnt);
    setFollowingCnt(ingCnt);
  }, [userData, erCnt, ingCnt]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const fetchData = async () => {
      setModalLoading(true);

      try {
        const res = await fetch(
          `/api/users/${user.username}/list?type=${modalTab}`,
          { signal }
        );
        const data = await res.json();

        // Get the list of people we are following
        const followingRes = await fetch(
          `/api/users/${viewerInfo.username}/list?type=following`,
          { signal }
        );
        const ourFollowingData = await followingRes.json();

        const mutualList = [];
        const acqList = [];
        data.users.forEach((user) => {
          if (
            ourFollowingData.users.some((user2) => {
              return user._id === user2._id || user._id === viewerInfo.dbId;
            })
          ) {
            mutualList.push(user);
          } else {
            acqList.push(user);
          }
        });

        const listData = { mutual: mutualList, acquaintances: acqList };
        if (modalTab === "followers") {
          setFollowerList(listData);
          setFollowerCnt(mutualList.length + acqList.length);
        } else if (modalTab === "following") {
          setFollowingList(listData);
          setFollowingCnt(mutualList.length + acqList.length);
        }
      } catch (err) {}

      setModalLoading(false);
    };

    if (modalTab) {
      fetchData();
    }

    // Cancel current fetch request if we switch tabs
    return () => {
      controller.abort();
      setModalLoading(false);
    };
  }, [modalActive, modalTab, user, viewerInfo]);

  const displayFollowList = (tab) => {
    setModalTab(tab);
    setModalActive(true);
  };

  const updateFollowerCnt = (didFollow) => {
    setFollowerCnt((prev) => prev + (didFollow ? 1 : -1));
  };

  const updateFollowingCnt = (didFollow) => {
    setFollowingCnt((prev) => prev + (didFollow ? 1 : -1));
  };

  return (
    <>
      <div className={classes.wrapper}>
        {/* Header bar */}
        <header>
          {/* If this is the user's profile, don't show the back button*/}
          {!ownProfile && (
            <MdOutlineArrowBack
              className={classes.hoverCursor}
              onClick={() => router.back()}
            />
          )}

          <span className={classes.name}>{user.username}</span>
        </header>

        {/* Profile Picture + User Stats */}
        <UserHeader
          user={user}
          postCnt={postCnt}
          followerCnt={followerCnt}
          followingCnt={followingCnt}
          displayFollowList={displayFollowList}
        />

        {/* Action Buttons */}
        {!ownProfile && (
          <div className={classes.profileActions}>
            <FollowButton
              username={user.username}
              viewerIsFollowing={viewerIsFollowing}
              updateFollowCount={updateFollowerCnt}
            />
            <div>
              <Button
                outline
                onClick={() => router.push(`/t/${user._id}`)}
                className={classes.additBtnClass}
              >
                Message
              </Button>
            </div>
          </div>
        )}

        {/* Posts */}
        <UserPosts username={user.username} />
      </div>

      {/* Followers/Following Modal */}
      <Modal active={modalActive} modalBodyClasses={classes.modal}>
        {/* Header of follower/following list */}
        <header className={classes.modalActions}>
          <div className={classes.modalTabs}>
            <button
              className={`${
                modalTab === "followers" && classes.modalTabActive
              }`}
              onClick={() => displayFollowList("followers")}
            >
              Followers
            </button>
            <button
              className={`${
                modalTab === "following" && classes.modalTabActive
              }`}
              onClick={() => displayFollowList("following")}
            >
              Following
            </button>
          </div>
          <MdClose
            className={classes.modalClose}
            onClick={() => setModalActive(false)}
          />
        </header>

        {/* List of followers/following */}
        <div className={classes.modalContent}>
          {modalLoading ? (
            <div className={classes.spinnerContainer}>
              <LoadingSpinner />
            </div>
          ) : (
            <UserList
              updateFollowCount={
                modalTab === "followers" && ownProfile
                  ? updateFollowingCnt
                  : () => {}
              }
              shared={
                modalTab === "followers"
                  ? followerList.mutual
                  : followingList.mutual
              }
              notShared={
                modalTab === "followers"
                  ? followerList.acquaintances
                  : followingList.acquaintances
              }
            />
          )}
        </div>
      </Modal>
    </>
  );
};

export default Profile;

/* 
  -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
                      User Header Component
  -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
*/
const UserHeader = ({
  user,
  postCnt,
  followerCnt,
  followingCnt,
  displayFollowList,
}) => {
  return (
    <>
      <section>
        <LoadImage
          src={user.profilePic.url}
          alt={`${user.name}'s Profile Picture`}
          width={80}
          height={80}
        />
        <div>
          <p>
            <span className={classes.num}>{postCnt}</span>
            <span>Posts</span>
          </p>
          <p
            onClick={() => displayFollowList("followers")}
            className={classes.link}
          >
            <span className={classes.num}>{followConversion(followerCnt)}</span>
            <span>Followers</span>
          </p>
          <p
            onClick={() => displayFollowList("following")}
            className={classes.link}
          >
            <span className={classes.num}>
              {followConversion(followingCnt)}
            </span>
            <span>Following</span>
          </p>
        </div>
      </section>

      <p className={classes.name}>{user.name}</p>
      <TextBreaker className={classes.bio}>{user.bio}</TextBreaker>
    </>
  );
};

/* 
  -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
                    User Posts Preview Component
  -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
*/
const UserPosts = ({ username }) => {
  const { loading, results } = useLazyFetch(
    `/api/users/${username}/posts`,
    FETCH_AMOUNT
  );

  return (
    <>
      <PostGrid posts={results} />
      {loading && (
        <div className={classes.spinnerContainer}>
          <LoadingSpinner />
        </div>
      )}
    </>
  );
};
