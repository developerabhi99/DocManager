import { prisma } from "../../src/config/db";
import bcrypt from "bcrypt";
async function main() {
    console.log("🌱 Seeding database...");
    /* ===============================
       1. CREATE PERMISSIONS (MODULES)
       =============================== */
    const permissionKeys = [
        "MANAGE_USERS",
        "MANAGE_ROLES",
        "VIEW_USERS",
        "CREATE_APPOINTMENT",
        "VIEW_APPOINTMENT",
        "MANAGE_APPOINTMENT",
        "VIEW_TRANSACTIONS",
        "MANAGE_TRANSACTIONS",
        "VIEW_REPORTS",
    ];
    const permissions = await Promise.all(permissionKeys.map((key) => prisma.permission.upsert({
        where: { key },
        update: {},
        create: { key },
    })));
    console.log("✅ Permissions created");
    /* ===============================
       2. CREATE ROLES
       =============================== */
    const superAdminRole = await prisma.role.upsert({
        where: { name: "SUPER_ADMIN" },
        update: {},
        create: {
            name: "SUPER_ADMIN",
            description: "Full system access",
        },
    });
    const doctorRole = await prisma.role.upsert({
        where: { name: "DOCTOR" },
        update: {},
        create: {
            name: "DOCTOR",
            description: "Doctor role",
        },
    });
    const therapistRole = await prisma.role.upsert({
        where: { name: "THERAPIST" },
        update: {},
        create: {
            name: "THERAPIST",
            description: "Therapist role",
        },
    });
    const salesRole = await prisma.role.upsert({
        where: { name: "SALES" },
        update: {},
        create: {
            name: "SALES",
            description: "Sales role",
        },
    });
    console.log("✅ Roles created");
    /* ===============================
       3. ASSIGN PERMISSIONS TO ROLES
       =============================== */
    // SUPER ADMIN → ALL PERMISSIONS
    await Promise.all(permissions.map((permission) => prisma.rolePermission.upsert({
        where: {
            roleId_permissionId: {
                roleId: superAdminRole.id,
                permissionId: permission.id,
            },
        },
        update: {},
        create: {
            roleId: superAdminRole.id,
            permissionId: permission.id,
        },
    })));
    // DOCTOR
    await prisma.rolePermission.createMany({
        data: permissions
            .filter((p) => ["VIEW_USERS", "VIEW_REPORTS", "VIEW_APPOINTMENT"].includes(p.key))
            .map((p) => ({
            roleId: doctorRole.id,
            permissionId: p.id,
        })),
        skipDuplicates: true,
    });
    // THERAPIST
    await prisma.rolePermission.createMany({
        data: permissions
            .filter((p) => ["VIEW_APPOINTMENT", "CREATE_APPOINTMENT"].includes(p.key))
            .map((p) => ({
            roleId: therapistRole.id,
            permissionId: p.id,
        })),
        skipDuplicates: true,
    });
    // SALES
    await prisma.rolePermission.createMany({
        data: permissions
            .filter((p) => ["VIEW_TRANSACTIONS", "MANAGE_TRANSACTIONS"].includes(p.key))
            .map((p) => ({
            roleId: salesRole.id,
            permissionId: p.id,
        })),
        skipDuplicates: true,
    });
    console.log("✅ Role permissions assigned");
    /* ===============================
       4. CREATE USER TYPE HIERARCHY
       =============================== */
    const superAdminType = await prisma.userType.create({
        data: { name: "SUPER_ADMIN" },
    });
    const doctorType = await prisma.userType.create({
        data: { name: "DOCTOR", parentId: superAdminType.id },
    });
    const psychiatristType = await prisma.userType.create({
        data: { name: "PSYCHIATRIST", parentId: doctorType.id },
    });
    const therapistType = await prisma.userType.create({
        data: { name: "THERAPIST", parentId: psychiatristType.id },
    });
    const juniorTherapistType = await prisma.userType.create({
        data: { name: "JUNIOR_THERAPIST", parentId: therapistType.id },
    });
    const salesType = await prisma.userType.create({
        data: { name: "SALES", parentId: superAdminType.id },
    });
    const transactionType = await prisma.userType.create({
        data: { name: "TRANSACTION", parentId: salesType.id },
    });
    const appointmentManagerType = await prisma.userType.create({
        data: { name: "APPOINTMENT_MANAGER", parentId: transactionType.id },
    });
    console.log("✅ User hierarchy created");
    /* ===============================
       5. CREATE SUPER ADMIN USER
       =============================== */
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const salt = await bcrypt.genSalt(10);
    await prisma.user.upsert({
        where: { email: "admin@system.com" },
        update: {},
        create: {
            name: "Super Admin",
            email: "admin@system.com",
            password: hashedPassword,
            salt: salt,
            roleId: superAdminRole.id,
            userTypeId: superAdminType.id,
        },
    });
    console.log("✅ Super Admin user created");
}
main()
    .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map