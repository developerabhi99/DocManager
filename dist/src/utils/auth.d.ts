import jwt from "jsonwebtoken";
export declare function generateSalt(): string;
export declare function hashPassword(password: string, salt: string): string;
export declare function verifyPassword(password: string, salt: string, hashedPassword: string): boolean;
export declare function generateToken(payload: {
    userId: string;
    role: string;
}): string;
export declare function verifyToken(token: string): string | jwt.JwtPayload;
//# sourceMappingURL=auth.d.ts.map