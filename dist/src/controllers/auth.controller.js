import { prisma } from "../config/db.js";
import { verifyPassword, generateToken, } from "../utils/auth.js";
//const prisma = new PrismaClient();
export async function login(req, res) {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            role: {
                include: {
                    permissions: {
                        include: { permission: true },
                    },
                },
            },
        },
    });
    console.log(user);
    if (!user || !user.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    const isValid = verifyPassword(password, user.salt, user.password);
    if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = generateToken({
        userId: user.id,
        role: user.role.name,
    });
    return res.json({
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role.name,
        },
    });
}
//# sourceMappingURL=auth.controller.js.map