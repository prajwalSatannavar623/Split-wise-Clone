import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    userName: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password id required"],
    },
    avatar: {
      type: String, // cloudinary service
      required: true,
    },
    One2OneExpense: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        amount: {
          type: Number,
        },
      },
    ],
    groupsIn: [
      {
        type: Schema.Types.ObjectId,
        ref: "Group",
      },
    ],
    favGroups: [
      {
        type: Schema.Types.ObjectId,
        ref: "Group",
      },
    ],
    subscriptionPlan: {
      type: String,
      enum: ["base", "pro"],
      default: "base",
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true },
);

// hash password whenever it is modified
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// injecting the custom methods into userSchema
userSchema.methods.isPasswordCorrect = async function (password) {
  const isMatch = await bcrypt.compare(password, this.password);
  return isMatch;
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      userName: this.userName,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    },
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    },
  );
};

export const User = mongoose.model("User", userSchema);
