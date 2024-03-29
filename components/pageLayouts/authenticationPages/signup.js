import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/router";
import { signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";

import global from "../../../global";
import { usernameFriendly } from "../../../lib/validate";
import Button from "../../formElements/button";
import FormInput from "../../formElements/formInput";
import Card from "../../ui/card/card";
import AppLogo from "../../ui/appLogo/appLogo";
import classes from "./authStyles.module.css";

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

const SignUp = () => {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [canSubmit, setCanSubmit] = useState(false);
  const [errors, setErrors] = useState({ username: false, password: false });

  /* On field update, check to see if we can submit form */
  useEffect(() => {
    if (
      !errors.username &&
      !errors.password &&
      usernameFriendly(username) &&
      password.trim().length > 5
    ) {
      setCanSubmit(true);
    } else {
      setCanSubmit(false);
    }
  }, [username, password, errors]);

  /* Used to check if a username is avaliable */
  const isUsernameUnused = async () => {
    if (username.length === 0) return;

    const res = await fetch(
      `/api/users/${encodeURIComponent(username)}/isAvaliable`
    );
    const data = await res.json();
    if (res.ok) {
      setErrors((prev) => ({ ...prev, username: data.used }));
    } else {
      global.alerts.actions.addAlert({
        type: global.alerts.types.error,
        content: data.message,
      });
    }
  };

  /* Used to validate password structure */
  const checkPassword = () => {
    setErrors((prev) => ({ ...prev, password: password.length < 6 }));
  };

  const signupHandler = async (e) => {
    e.preventDefault();
    /* Final Client-Side Checks before attempt submission to backend */
    if (!usernameFriendly(username) || password.trim().length < 6) {
      global.alerts.actions.addAlert({
        type: global.alerts.types.error,
        content: "Invalid inputs.",
      });
      setCanSubmit(false);
      return;
    }

    window.grecaptcha.ready(() => {
      window.grecaptcha
        .execute(SITE_KEY, { action: "signUp" })
        .then(async (token) => {
          const userInfoObj = {
            username: username,
            password: password.trim(),
            recaptchaResponse: token,
          };

          const res = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userInfoObj),
          });
          const data = await res.json();

          if (res.ok) {
            const result = await signIn("credentials", {
              redirect: false,
              ...userInfoObj,
            });

            if (!result.error) router.replace("/");
          } else {
            global.alerts.actions.addAlert({
              type: global.alerts.types.error,
              content: data.message,
            });
          }
        });
    });
  };

  return (
    <>
      <Script
        src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
      />

      <div className={classes.containerWrap}>
        <div className={classes.wrapper}>
          <Card className={classes["main-content-wrapper"]}>
            <AppLogo />

            <p className={`center ${classes["catch-phrase"]}`}>
              Sign up to see photos and videos from your friends.
            </p>

            {/* Will trim front of inputs onChange & trim end of inputs onBlur/focus out. */}
            <form onSubmit={signupHandler}>
              <FormInput
                type="text"
                placeholder="Username"
                minLength="8"
                maxLength="30"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.trim())}
                onBlur={isUsernameUnused}
                errMsg="This username has already been used."
                hasErr={errors.username}
              />
              <FormInput
                type="password"
                placeholder="Password"
                minLength="6"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value.trimStart())}
                onBlur={() => {
                  setPassword((prev) => prev.trimEnd());
                  checkPassword();
                }}
                errMsg="Please enter a password (min 6 characters)."
                hasErr={errors.password}
              />

              <Button
                type="submit"
                disabled={!canSubmit}
                style={{ margin: "1rem 0" }}
              >
                Sign up
              </Button>
            </form>
          </Card>

          <Card className={classes.redirect}>
            <p className="center">
              Have an account?{" "}
              <Link href="/">
                <a className={classes.link}>Log in</a>
              </Link>
            </p>
          </Card>
        </div>
      </div>
    </>
  );
};

export default SignUp;
