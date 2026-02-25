import { prisma } from "../config/db.js";
//const prisma = new PrismaClient();
export function hasPermission(permissionKey) {
    return async (req, res, next) => {
        const userId = req.user.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
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
        const allowed = user?.role.permissions.some((rp) => rp.permission.key === permissionKey);
        if (!allowed) {
            return res.status(403).json({ message: "Access denied" });
        }
        next();
    };
}
//# sourceMappingURL=permission.middleware.js.map