import { prisma } from "../../src/config/db.js";
import { generateSalt, hashPassword } from "../../src/utils/auth.js";
async function main() {
    console.log("🌱 Starting database seeding...");
    // Clean existing data in correct order to respect foreign key constraints
    await prisma.medicalReport.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.patient.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.doctorSchedule.deleteMany();
    await prisma.employeeSchedule.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.user.deleteMany();
    await prisma.department.deleteMany();
    await prisma.role.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.userType.deleteMany();
    console.log("🧹 Cleaned existing data");
    /* ===============================
       1. CREATE USER TYPES
       =============================== */
    const adminType = await prisma.userType.create({
        data: { name: 'ADMIN' }
    });
    console.log("👥 Created user types");
    /* ===============================
       2. CREATE PERMISSIONS
       =============================== */
    const permissions = await Promise.all([
        prisma.permission.create({ data: { key: 'MANAGE_USERS', description: 'Manage system users' } }),
        prisma.permission.create({ data: { key: 'MANAGE_APPOINTMENTS', description: 'Manage appointments' } }),
        prisma.permission.create({ data: { key: 'MANAGE_DEPARTMENTS', description: 'Manage departments' } }),
        prisma.permission.create({ data: { key: 'VIEW_REPORTS', description: 'View medical reports' } }),
        prisma.permission.create({ data: { key: 'MANAGE_SCHEDULE', description: 'Manage schedules' } }),
        prisma.permission.create({ data: { key: 'MANAGE_TRANSACTIONS', description: 'Manage financial transactions' } }),
        prisma.permission.create({ data: { key: 'MANAGE_ROLES', description: 'Manage roles and permissions' } }),
    ]);
    console.log("🔐 Created permissions");
    /* ===============================
       3. CREATE ROLES
       =============================== */
    const superAdminRole = await prisma.role.create({
        data: {
            name: 'SUPER_ADMIN',
            description: 'Full system access',
            permissions: {
                create: permissions.map(p => ({
                    permission: { connect: { id: p.id } }
                }))
            }
        }
    });
    console.log("🎭 Created roles");
    /* ===============================
       4. CREATE DEPARTMENTS
       =============================== */
    const adminDepartment = await prisma.department.create({
        data: {
            name: 'Administration',
            description: 'General administration and operations'
        }
    });
    console.log("🏢 Created departments");
    /* ===============================
       5. CREATE ADMIN USER
       =============================== */
    const salt = generateSalt();
    // Super Admin
    await prisma.user.create({
        data: {
            name: 'Super Admin',
            email: 'admin@system.com',
            password: hashPassword('admin123', salt),
            salt,
            empId: 'SA001',
            isActive: true,
            roleId: superAdminRole.id,
            userTypeId: adminType.id,
            departmentId: adminDepartment.id
        }
    });
    console.log("👤 Created admin user");
    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Created summary:');
    console.log(`   - User Types: ${1}`);
    console.log(`   - Permissions: ${permissions.length}`);
    console.log(`   - Roles: ${1}`);
    console.log(`   - Departments: ${1}`);
    console.log(`   - Users: ${1}`);
    console.log('\n🔑 Login credentials:');
    console.log('   Super Admin: admin@system.com / admin123');
}
main()
    .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map