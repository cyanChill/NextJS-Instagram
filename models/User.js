import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Please provide a username."],
    unique: true,
    minlength: [8, "Usernames can't be less than 3 character."],
    maxlength: [30, "Usernames can't be more than 30 characters."],
  },
  username_lower: { type: String, lowercase: true, trim: true },
  name: {
    type: String,
    required: [true, "Please provide a name."],
    minlength: [8, "Names can't be less than 3 character."],
    maxlength: [30, "Names can't be more than 30 characters."],
  },
  password: {
    type: String,
    minlength: [6, "Passwords can't be less than 6 character."],
    required: [true, "Please provide a hashed password."],
    select: false,
  },
  bio: {
    type: String,
    maxlength: [200, "Bio can't be more than 200 characters."],
    default: "",
  },
  profilePic: {
    url: {
      type: String,
      required: [true, "Please provide a img url."],
      default: `${process.env.NEXT_PUBLIC_DEFAULT_PROFILEPIC_URL}`,
    },
    identifier: {
      type: String,
      required: [true, "Please provide an img identifier in Firebase."],
      default: `${process.env.NEXT_PUBLIC_DEFAULT_PROFILEPIC_IDENTIFIER}`,
    },
  },
});

UserSchema.pre("save", function (next) {
  this["username_lower"] = this.username.toLowerCase();
  next();
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
