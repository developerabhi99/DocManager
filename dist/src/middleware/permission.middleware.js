import { prisma } from "../config/db.js";
//const prisma = new PrismaClient();
export function hasPermission(permissionKey) {
    return async (req, res, next) => {
        const userId = req.user?.userId;
        if (!userId || typeof userId !== "string") {
            return res.status(401).json({ message: "Token missing" });
        }
        const required = Array.isArray(permissionKey)
            ? permissionKey
            : [permissionKey];
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
        const userPermissions = (user?.role?.permissions || []).map((rp) => rp.permission?.key);
        //console.log("User permissions:", userPermissions);
        const allowed = required.some((k) => userPermissions.includes(k));
        //console.log("Allowed:", allowed);
        if (!allowed) {
            return res.status(403).json({ message: "Access denied" });
        }
        next();
    };
}
//# sourceMappingURL=permission.middleware.js.map