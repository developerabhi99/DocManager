import crypto from "crypto";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "1d";
/* ============================
   PASSWORD HELPERS
============================ */
export function generateSalt() {
    return crypto.randomBytes(16).toString("hex");
}
export function hashPassword(password, salt) {
    return crypto
        .pbkdf2Sync(password, salt, 10000, 64, "sha512")
        .toString("hex");
}
export function verifyPassword(password, salt, hashedPassword) {
    const hash = hashPassword(password, salt);
    return hash === hashedPassword;
}
/* ============================
   JWT HELPERS
============================ */
export function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
}
export function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}
//# sourceMappingURL=auth.js.map