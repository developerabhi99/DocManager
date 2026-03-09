import { prisma } from "../config/db.js";
import { generateSalt, hashPassword } from "../utils/auth.js";
export async function listUsers(req, res) {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            role: {
                include: {
                    permissions: {
                        include: { permission: true },
                    },
                },
            },
            userType: { select: { id: true, name: true } },
            department: { select: { id: true, name: true } },
        },
    });
    // Transform the data to match the expected format
    const transformedUsers = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        empId: user.empId,
        isActive: user.isActive,
        imageUrl: user.imageUrl,
        createdAt: user.createdAt,
        role: {
            id: user.role.id,
            name: user.role.name,
            permissions: (user.role.permissions || []).map((rp) => rp.permission.key),
        },
        userType: user.userType,
        department: user.department,
    }));
    return res.json({ users: transformedUsers });
}
export async function listRoles(req, res) {
    const roles = await prisma.role.findMany({
        orderBy: { name: "asc" },
        include: {
            permissions: {
                include: { permission: true },
            },
        },
    });
    const mapped = roles.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        permissions: (r.permissions || []).map((rp) => rp.permission.key),
        permissionIds: (r.permissions || []).map((rp) => rp.permission.id),
    }));
    return res.json({ roles: mapped });
}
export async function listPermissions(req, res) {
    const permissions = await prisma.permission.findMany({
        orderBy: { key: "asc" },
        select: {
            id: true,
            key: true,
            description: true,
        },
    });
    return res.json({ permissions });
}
export async function listUserTypes(req, res) {
    const userTypes = await prisma.userType.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, parentId: true },
    });
    return res.json({ userTypes });
}
export async function createRole(req, res) {
    const { name, description, permissionIds } = req.body || {};
    if (!name || typeof name !== "string") {
        return res.status(400).json({ message: "name is required" });
    }
    const existing = await prisma.role.findUnique({ where: { name } });
    if (existing) {
        return res.status(409).json({ message: "Role already exists" });
    }
    const created = await prisma.role.create({
        data: {
            name,
            description: typeof description === "string" ? description : null,
        },
        select: { id: true, name: true, description: true },
    });
    const ids = Array.isArray(permissionIds)
        ? permissionIds.filter((x) => typeof x === "string")
        : [];
    if (ids.length) {
        await prisma.rolePermission.createMany({
            data: ids.map((permissionId) => ({
                roleId: created.id,
                permissionId,
            })),
            skipDuplicates: true,
        });
    }
    return res.status(201).json({ role: created });
}
export async function updateRolePermissions(req, res) {
    const { roleId } = req.params;
    const { permissionIds } = req.body || {};
    if (!roleId || typeof roleId !== "string") {
        return res.status(400).json({ message: "Invalid roleId" });
    }
    const ids = Array.isArray(permissionIds)
        ? permissionIds.filter((x) => typeof x === "string")
        : [];
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
        return res.status(404).json({ message: "Role not found" });
    }
    await prisma.$transaction([
        prisma.rolePermission.deleteMany({ where: { roleId } }),
        prisma.rolePermission.createMany({
            data: ids.map((permissionId) => ({ roleId, permissionId })),
            skipDuplicates: true,
        }),
    ]);
    return res.json({ message: "Role permissions updated" });
}
export async function createPermission(req, res) {
    const { key, description } = req.body || {};
    if (!key || typeof key !== "string") {
        return res.status(400).json({ message: "key is required" });
    }
    const existing = await prisma.permission.findUnique({ where: { key } });
    if (existing) {
        return res.status(409).json({ message: "Permission already exists" });
    }
    const created = await prisma.permission.create({
        data: {
            key,
            description: typeof description === "string" ? description : null,
        },
        select: { id: true, key: true, description: true },
    });
    return res.status(201).json({ permission: created });
}
export async function createUserType(req, res) {
    const { name, parentId } = req.body || {};
    if (!name || typeof name !== "string") {
        return res.status(400).json({ message: "name is required" });
    }
    const existing = await prisma.userType.findUnique({ where: { name } });
    if (existing) {
        return res.status(409).json({ message: "User type already exists" });
    }
    if (typeof parentId === "string" && parentId.trim() !== "") {
        const parent = await prisma.userType.findUnique({ where: { id: parentId } });
        if (!parent) {
            return res.status(400).json({ message: "Invalid parentId" });
        }
    }
    const created = await prisma.userType.create({
        data: {
            name,
            parentId: typeof parentId === "string" && parentId.trim() !== ""
                ? parentId
                : null,
        },
        select: { id: true, name: true, parentId: true },
    });
    return res.status(201).json({ userType: created });
}
export async function createUser(req, res) {
    const { name, email, password, empId, isActive, roleId, userTypeId, departmentId, } = req.body || {};
    if (!name || typeof name !== "string") {
        return res.status(400).json({ message: "name is required" });
    }
    if (!email || typeof email !== "string") {
        return res.status(400).json({ message: "email is required" });
    }
    if (!password || typeof password !== "string") {
        return res.status(400).json({ message: "password is required" });
    }
    if (!roleId || typeof roleId !== "string") {
        return res.status(400).json({ message: "roleId is required" });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        return res.status(409).json({ message: "Email already exists" });
    }
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
        return res.status(400).json({ message: "Invalid roleId" });
    }
    let resolvedUserTypeId = typeof userTypeId === "string" && userTypeId.trim() !== ""
        ? userTypeId
        : undefined;
    if (!resolvedUserTypeId) {
        const ut = await prisma.userType.findUnique({ where: { name: role.name } });
        resolvedUserTypeId = ut?.id;
    }
    if (!resolvedUserTypeId) {
        return res.status(400).json({
            message: "userTypeId is required (no matching user type found)",
        });
    }
    // Validate departmentId if provided
    let resolvedDepartmentId = null;
    if (departmentId && typeof departmentId === "string" && departmentId.trim() !== "") {
        const dept = await prisma.department.findUnique({ where: { id: departmentId } });
        if (!dept) {
            return res.status(400).json({ message: "Invalid departmentId" });
        }
        resolvedDepartmentId = departmentId;
    }
    const salt = generateSalt();
    const hashed = hashPassword(password, salt);
    const created = await prisma.user.create({
        data: {
            name,
            email,
            password: hashed,
            salt,
            empId: typeof empId === "string" ? empId : null,
            isActive: typeof isActive === "boolean" ? isActive : true,
            roleId,
            userTypeId: resolvedUserTypeId,
            departmentId: resolvedDepartmentId,
        },
        include: {
            role: {
                include: {
                    permissions: {
                        include: { permission: true },
                    },
                },
            },
            userType: { select: { id: true, name: true } },
            department: { select: { id: true, name: true } },
        },
    });
    const transformedUser = {
        id: created.id,
        name: created.name,
        email: created.email,
        empId: created.empId,
        isActive: created.isActive,
        imageUrl: created.imageUrl,
        createdAt: created.createdAt,
        role: {
            id: created.role.id,
            name: created.role.name,
            permissions: (created.role.permissions || []).map((rp) => rp.permission.key),
        },
        userType: created.userType,
        department: created.department,
    };
    return res.status(201).json({ user: transformedUser });
}
export async function updateUserProfile(req, res) {
    const { id } = req.params;
    const { name, email, empId, isActive, roleId, userTypeId, departmentId, } = req.body || {};
    if (!name || typeof name !== "string") {
        return res.status(400).json({ message: "name is required" });
    }
    if (!email || typeof email !== "string") {
        return res.status(400).json({ message: "email is required" });
    }
    if (!roleId || typeof roleId !== "string") {
        return res.status(400).json({ message: "roleId is required" });
    }
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
        return res.status(404).json({ message: "User not found" });
    }
    // Check if email is being changed and if it already exists
    if (email !== existing.email) {
        const emailExists = await prisma.user.findUnique({ where: { email } });
        if (emailExists) {
            return res.status(409).json({ message: "Email already exists" });
        }
    }
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
        return res.status(400).json({ message: "Invalid roleId" });
    }
    let resolvedUserTypeId = typeof userTypeId === "string" && userTypeId.trim() !== ""
        ? userTypeId
        : undefined;
    if (!resolvedUserTypeId) {
        const ut = await prisma.userType.findUnique({ where: { name: role.name } });
        resolvedUserTypeId = ut?.id;
    }
    if (!resolvedUserTypeId) {
        return res.status(400).json({
            message: "userTypeId is required (no matching user type found)",
        });
    }
    // Validate departmentId if provided
    let resolvedDepartmentId = null;
    if (departmentId && typeof departmentId === "string" && departmentId.trim() !== "") {
        const dept = await prisma.department.findUnique({ where: { id: departmentId } });
        if (!dept) {
            return res.status(400).json({ message: "Invalid departmentId" });
        }
        resolvedDepartmentId = departmentId;
    }
    const updated = await prisma.user.update({
        where: { id },
        data: {
            name,
            email,
            empId: typeof empId === "string" ? empId : null,
            isActive: typeof isActive === "boolean" ? isActive : existing.isActive,
            roleId,
            userTypeId: resolvedUserTypeId,
            departmentId: resolvedDepartmentId,
        },
        include: {
            role: {
                include: {
                    permissions: {
                        include: { permission: true },
                    },
                },
            },
            userType: { select: { id: true, name: true } },
            department: { select: { id: true, name: true } },
        },
    });
    const transformedUser = {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        empId: updated.empId,
        isActive: updated.isActive,
        imageUrl: updated.imageUrl,
        createdAt: updated.createdAt,
        role: {
            id: updated.role.id,
            name: updated.role.name,
            permissions: (updated.role.permissions || []).map((rp) => rp.permission.key),
        },
        userType: updated.userType,
        department: updated.department,
    };
    return res.json({ user: transformedUser });
}
//# sourceMappingURL=admin.controller.js.map