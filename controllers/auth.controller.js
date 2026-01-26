import User from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import { errorHandler } from "../utils/error.js";
import jwt from "jsonwebtoken";

export const signup = async (req, res, next) => {
  const { username, email, password } = req.body;
  const hashedPassword = bcryptjs.hashSync(password, 10);
  const newUser = new User({ username, email, password: hashedPassword });
  try {
    await newUser.save();
    res.status(201).json("User created successfully");
  } catch (error) {
    next(error);
  }
};

export const signin = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const validUser = await User.findOne({ email });
    if (!validUser) return next(errorHandler(404, "User not found"));

    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) return next(errorHandler(401, "Invalid credentials"));

    // Generate simple session token
    const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    // Save session token to user
    await User.findByIdAndUpdate(validUser._id, { sessionToken });
    
    const { password: pass, ...rest } = validUser._doc;

    res
      .cookie("access_token", sessionToken, { 
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/'
      })
      .status(200)
      .json(rest);
  } catch (error) {
    next(error);
  }
};

export const google = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
      await User.findByIdAndUpdate(user._id, { sessionToken });
      
      const { password: pass, ...rest } = user._doc;
      res
        .cookie("access_token", sessionToken, { 
          httpOnly: true,
          sameSite: 'lax',
          secure: false,
          path: '/'
        })
        .status(200)
        .json(rest);
    } else {
      const generatedPassword =
        Math.random().toString(36).slice(-8) +
        Math.random().toString(36).slice(-8);
      const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);
      const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
      
      const newUser = new User({
        username:
          req.body.name.split(" ").join("").toLowerCase() +
          Math.random().toString(36).slice(-4),
        email: req.body.email,
        password: hashedPassword,
        avatar: req.body.photo,
        sessionToken
      });

      await newUser.save();
      const { password:pass, ...rest } = newUser._doc;
      res
        .cookie("access_token", sessionToken, { 
          httpOnly: true,
          sameSite: 'lax',
          secure: false,
          path: '/'
        })
        .status(200)
        .json(rest);
    }
  } catch (error) {
    next(error);
  }
};

export const signOut = async (req, res, next) => {  
  try {
    const token = req.cookies.access_token;
    if (token) {
      // Clear session token from database
      await User.updateOne({ sessionToken: token }, { sessionToken: null });
    }
    
    res.clearCookie('access_token', { 
      path: '/',
      sameSite: 'lax',
      secure: false
    });
    res.status(200).json("User has been logged out!");
  } catch (error) {
    next(error);
  }
};