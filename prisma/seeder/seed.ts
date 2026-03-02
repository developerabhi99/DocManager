import { prisma } from "../../src/config/db.js";
import { generateSalt, hashPassword } from "../../src/utils/auth.js";

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

  const permissions = await Promise.all(
    permissionKeys.map((key) =>
      prisma.permission.upsert({
        where: { key },
        update: {},
        create: { key },
      })
    )
  );

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
  await Promise.all(
    permissions.map((permission: any) =>
      prisma.rolePermission.upsert({
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
      })
    )
  );

  // DOCTOR
  await prisma.rolePermission.createMany({
    data: permissions
      .filter((p: any) =>
        ["VIEW_USERS", "VIEW_REPORTS", "VIEW_APPOINTMENT", "CREATE_APPOINTMENT", "MANAGE_APPOINTMENT"].includes(p.key)
      )
      .map((p: any) => ({
        roleId: doctorRole.id,
        permissionId: p.id,
      })),
    skipDuplicates: true,
  });

  // THERAPIST
  await prisma.rolePermission.createMany({
    data: permissions
      .filter((p: any) =>
        ["VIEW_APPOINTMENT", "CREATE_APPOINTMENT"].includes(p.key)
      )
      .map((p: any) => ({
        roleId: therapistRole.id,
        permissionId: p.id,
      })),
    skipDuplicates: true,
  });

  // SALES
  await prisma.rolePermission.createMany({
    data: permissions
      .filter((p: any) =>
        ["VIEW_TRANSACTIONS", "MANAGE_TRANSACTIONS"].includes(p.key)
      )
      .map((p: any) => ({
        roleId: salesRole.id,
        permissionId: p.id,
      })),
    skipDuplicates: true,
  });

  console.log("✅ Role permissions assigned");

  /* ===============================
     4. CREATE USER TYPE HIERARCHY
     =============================== */

  const superAdminType = await prisma.userType.upsert({
    where: { name: "SUPER_ADMIN" },
    update: {},
    create: { name: "SUPER_ADMIN" },
  });

  const doctorType = await prisma.userType.upsert({
    where: { name: "DOCTOR" },
    update: {},
    create: { name: "DOCTOR", parentId: superAdminType.id },
  });

  const psychiatristType = await prisma.userType.upsert({
    where: { name: "PSYCHIATRIST" },
    update: {},
    create: { name: "PSYCHIATRIST", parentId: doctorType.id },
  });

  const therapistType = await prisma.userType.upsert({
    where: { name: "THERAPIST" },
    update: {},
    create: { name: "THERAPIST", parentId: psychiatristType.id },
  });

  const juniorTherapistType = await prisma.userType.upsert({
    where: { name: "JUNIOR_THERAPIST" },
    update: {},
    create: { name: "JUNIOR_THERAPIST", parentId: therapistType.id },
  });

  const salesType = await prisma.userType.upsert({
    where: { name: "SALES" },
    update: {},
    create: { name: "SALES", parentId: superAdminType.id },
  });

  const transactionType = await prisma.userType.upsert({
    where: { name: "TRANSACTION" },
    update: {},
    create: { name: "TRANSACTION", parentId: salesType.id },
  });

  const appointmentManagerType = await prisma.userType.upsert({
    where: { name: "APPOINTMENT_MANAGER" },
    update: {},
    create: { name: "APPOINTMENT_MANAGER", parentId: transactionType.id },
  });

  console.log("✅ User hierarchy created");

  /* ===============================
     5. CREATE SUPER ADMIN USER
     =============================== */

  const salt = generateSalt();
  const hashedPassword = hashPassword("admin123", salt);

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

  /* ===============================
     6. CREATE SAMPLE PATIENTS
     =============================== */
  const patients = await Promise.all([
    prisma.patient.create({
      data: {
        name: "Alice Johnson",
        email: "alice.johnson@example.com",
        phone: "+1234567890",
        address: "123 Main St, Springfield",
        age: 30,
        gender: "Female",
      },
    }),
    prisma.patient.create({
      data: {
        name: "Bob Smith",
        email: "bob.smith@example.com",
        phone: "+0987654321",
        address: "456 Oak Ave, Shelbyville",
        age: 45,
        gender: "Male",
      },
    }),
    prisma.patient.create({
      data: {
        name: "Carol White",
        phone: "+1122334455",
        address: "789 Pine Rd, Capital City",
        age: 28,
        gender: "Female",
      },
    }),
  ]);

  console.log("✅ Sample patients created");

  /* ===============================
     7. CREATE DOCTOR USERS
     =============================== */
  const doctorSalt = generateSalt();
  const doctorHashedPassword = hashPassword("doctor123", doctorSalt);

  const doctor1 = await prisma.user.upsert({
    where: { email: "doctor1@clinic.com" },
    update: {},
    create: {
      name: "Dr. Emily Brown",
      email: "doctor1@clinic.com",
      password: doctorHashedPassword,
      salt: doctorSalt,
      roleId: doctorRole.id,
      userTypeId: doctorType.id,
    },
  });

  const doctor2 = await prisma.user.upsert({
    where: { email: "doctor2@clinic.com" },
    update: {},
    create: {
      name: "Dr. Michael Green",
      email: "doctor2@clinic.com",
      password: doctorHashedPassword,
      salt: doctorSalt,
      roleId: doctorRole.id,
      userTypeId: doctorType.id,
    },
  });

  console.log("✅ Doctor users created");

  /* ===============================
     8. CREATE SAMPLE APPOINTMENTS
     =============================== */
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dayAfter = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  await Promise.all([
    prisma.appointment.create({
      data: {
        patientId: patients[0].id,
        doctorId: doctor1.id,
        dateTime: tomorrow,
        status: "SCHEDULED",
        notes: "Initial consultation",
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[1].id,
        doctorId: doctor2.id,
        dateTime: dayAfter,
        status: "SCHEDULED",
        notes: "Follow-up appointment",
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[2].id,
        doctorId: doctor1.id,
        dateTime: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        status: "COMPLETED",
        notes: "Routine checkup",
      },
    }),
  ]);

  console.log("✅ Sample appointments created");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });