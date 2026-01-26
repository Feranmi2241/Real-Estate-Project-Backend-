import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { errorHandler } from "./error.js";

export const verifyToken = async (req, res, next) => {
    const token = req.cookies.access_token;
    if (!token) return next(errorHandler(401, "Unauthorized"));

    try {
        // First try to find user by session token (new system)
        let user = await User.findOne({ sessionToken: token });
        
        // If not found, try JWT verification (old system compatibility)
        if (!user) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                user = await User.findById(decoded.id);
                if (user) {
                    // Update user with session token for future requests
                    const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
                    await User.findByIdAndUpdate(user._id, { sessionToken });
                    
                    // Update cookie with new session token
                    res.cookie("access_token", sessionToken, { 
                        httpOnly: true,
                        sameSite: 'lax',
                        secure: false,
                        path: '/'
                    });
                }
            } catch (jwtError) {
                return next(errorHandler(401, "Invalid session"));
            }
        }
        
        if (!user) {
            return next(errorHandler(401, "Invalid session"));
        }

        req.user = { id: user._id.toString() };
        next();
    } catch (error) {
        return next(errorHandler(401, "Authentication failed"));
    }
};