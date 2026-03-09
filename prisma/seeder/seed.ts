import { prisma } from "../../src/config/db.js";
import { generateSalt, hashPassword } from "../../src/utils/auth.js";

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clean existing data in correct order to respect foreign key constraints
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

  const doctorType = await prisma.userType.create({
    data: { name: 'DOCTOR' }
  });

  const staffType = await prisma.userType.create({
    data: { name: 'STAFF' }
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

  const adminRole = await prisma.role.create({
    data: {
      name: 'ADMIN',
      description: 'Administrative access',
      permissions: {
        create: permissions.filter(p => 
          ['MANAGE_USERS', 'MANAGE_APPOINTMENTS', 'VIEW_REPORTS', 'MANAGE_SCHEDULE'].includes(p.key)
        ).map(p => ({
          permission: { connect: { id: p.id } }
        }))
      }
    }
  });

  const doctorRole = await prisma.role.create({
    data: {
      name: 'DOCTOR',
      description: 'Medical practitioner access',
      permissions: {
        create: permissions.filter(p => 
          ['MANAGE_APPOINTMENTS', 'VIEW_REPORTS', 'MANAGE_SCHEDULE'].includes(p.key)
        ).map(p => ({
          permission: { connect: { id: p.id } }
        }))
      }
    }
  });

  const staffRole = await prisma.role.create({
    data: {
      name: 'STAFF',
      description: 'Support staff access',
      permissions: {
        create: permissions.filter(p => 
          ['MANAGE_APPOINTMENTS', 'VIEW_REPORTS'].includes(p.key)
        ).map(p => ({
          permission: { connect: { id: p.id } }
        }))
      }
    }
  });

  console.log("🎭 Created roles");

  /* ===============================
     4. CREATE DEPARTMENTS
     =============================== */
  const departments = await Promise.all([
    prisma.department.create({
      data: {
        name: 'Information Technology',
        description: 'IT infrastructure and software development team'
      }
    }),
    prisma.department.create({
      data: {
        name: 'Human Resources',
        description: 'Employee management and recruitment team'
      }
    }),
    prisma.department.create({
      data: {
        name: 'Finance',
        description: 'Financial management and accounting team'
      }
    }),
    prisma.department.create({
      data: {
        name: 'Medical Staff',
        description: 'Doctors, nurses, and medical practitioners'
      }
    }),
    prisma.department.create({
      data: {
        name: 'Administration',
        description: 'General administration and operations'
      }
    })
  ]);

  console.log("🏢 Created departments");

  /* ===============================
     5. CREATE USERS
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
      departmentId: departments[4].id // Administration
    }
  });

  // Admin Users
  const adminSalt = generateSalt();
  await prisma.user.create({
    data: {
      name: 'John Admin',
      email: 'john.admin@hospital.com',
      password: hashPassword('admin123', adminSalt),
      salt: adminSalt,
      empId: 'ADM001',
      isActive: true,
      roleId: adminRole.id,
      userTypeId: adminType.id,
      departmentId: departments[4].id // Administration
    }
  });

  // IT Department Users
  const itSalt = generateSalt();
  await prisma.user.create({
    data: {
      name: 'Sarah Wilson',
      email: 'sarah.wilson@hospital.com',
      password: hashPassword('staff123', itSalt),
      salt: itSalt,
      empId: 'IT001',
      isActive: true,
      roleId: staffRole.id,
      userTypeId: staffType.id,
      departmentId: departments[0].id // IT
    }
  });

  await prisma.user.create({
    data: {
      name: 'Mike Johnson',
      email: 'mike.johnson@hospital.com',
      password: hashPassword('staff123', itSalt),
      salt: itSalt,
      empId: 'IT002',
      isActive: true,
      roleId: staffRole.id,
      userTypeId: staffType.id,
      departmentId: departments[0].id // IT
    }
  });

  // HR Department Users
  const hrSalt = generateSalt();
  await prisma.user.create({
    data: {
      name: 'Emma Davis',
      email: 'emma.davis@hospital.com',
      password: hashPassword('staff123', hrSalt),
      salt: hrSalt,
      empId: 'HR001',
      isActive: true,
      roleId: staffRole.id,
      userTypeId: staffType.id,
      departmentId: departments[1].id // HR
    }
  });

  // Finance Department Users
  const financeSalt = generateSalt();
  await prisma.user.create({
    data: {
      name: 'Robert Chen',
      email: 'robert.chen@hospital.com',
      password: hashPassword('staff123', financeSalt),
      salt: financeSalt,
      empId: 'FIN001',
      isActive: true,
      roleId: staffRole.id,
      userTypeId: staffType.id,
      departmentId: departments[2].id // Finance
    }
  });

  // Medical Staff
  const doctorSalt = generateSalt();
  const doctor1 = await prisma.user.create({
    data: {
      name: 'Dr. Alice Smith',
      email: 'alice.smith@hospital.com',
      password: hashPassword('doctor123', doctorSalt),
      salt: doctorSalt,
      empId: 'DOC001',
      isActive: true,
      roleId: doctorRole.id,
      userTypeId: doctorType.id,
      departmentId: departments[3].id // Medical Staff
    }
  });

  const doctor2 = await prisma.user.create({
    data: {
      name: 'Dr. James Brown',
      email: 'james.brown@hospital.com',
      password: hashPassword('doctor123', doctorSalt),
      salt: doctorSalt,
      empId: 'DOC002',
      isActive: true,
      roleId: doctorRole.id,
      userTypeId: doctorType.id,
      departmentId: departments[3].id // Medical Staff
    }
  });

  await prisma.user.create({
    data: {
      name: 'Nurse Jennifer Lee',
      email: 'jennifer.lee@hospital.com',
      password: hashPassword('nurse123', doctorSalt),
      salt: doctorSalt,
      empId: 'NUR001',
      isActive: true,
      roleId: staffRole.id,
      userTypeId: staffType.id,
      departmentId: departments[3].id // Medical Staff
    }
  });

  console.log("👤 Created users");

  /* ===============================
     6. CREATE SAMPLE PATIENTS
     =============================== */
  const patients = await Promise.all([
    prisma.patient.create({
      data: {
        name: 'John Patient',
        email: 'john.patient@email.com',
        phone: '+1234567890',
        address: '123 Main St, City, State',
        age: 45,
        gender: 'MALE'
      }
    }),
    prisma.patient.create({
      data: {
        name: 'Jane Patient',
        email: 'jane.patient@email.com',
        phone: '+1234567892',
        address: '456 Oak Ave, City, State',
        age: 38,
        gender: 'FEMALE'
      }
    }),
    prisma.patient.create({
      data: {
        name: 'Robert Patient',
        email: 'robert.patient@email.com',
        phone: '+1234567894',
        address: '789 Pine Rd, City, State',
        age: 32,
        gender: 'MALE'
      }
    })
  ]);

  console.log("🏥 Created patients");

  /* ===============================
     7. CREATE SAMPLE APPOINTMENTS
     =============================== */
  await Promise.all([
    prisma.appointment.create({
      data: {
        patientId: patients[0].id,
        doctorId: doctor1.id,
        dateTime: new Date('2026-03-10T09:00:00Z'),
        notes: 'Patient coming for annual health checkup',
        status: 'SCHEDULED'
      }
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[1].id,
        doctorId: doctor2.id,
        dateTime: new Date('2026-03-10T10:30:00Z'),
        notes: 'Follow-up for previous treatment',
        status: 'SCHEDULED'
      }
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[2].id,
        doctorId: doctor1.id,
        dateTime: new Date('2026-03-11T14:00:00Z'),
        notes: 'Patient reports severe headaches',
        status: 'SCHEDULED'
      }
    })
  ]);

  console.log("📅 Created appointments");

  /* ===============================
     8. CREATE SAMPLE TRANSACTIONS
     =============================== */
  await Promise.all([
    prisma.transaction.create({
      data: {
        patientId: patients[0].id,
        amount: 150.00,
        paymentMethod: 'CARD',
        status: 'PAID',
        description: 'Consultation fee'
      }
    }),
    prisma.transaction.create({
      data: {
        patientId: patients[1].id,
        amount: 200.00,
        paymentMethod: 'CASH',
        status: 'PENDING',
        description: 'Specialist consultation'
      }
    })
  ]);

  console.log("💳 Created transactions");

  console.log('\n✅ Database seeding completed successfully!');
  console.log('\n📊 Created summary:');
  console.log(`   - User Types: ${3}`);
  console.log(`   - Permissions: ${permissions.length}`);
  console.log(`   - Roles: ${4}`);
  console.log(`   - Departments: ${departments.length}`);
  console.log(`   - Users: ${9}`);
  console.log(`   - Patients: ${patients.length}`);
  
  console.log('\n🔑 Login credentials:');
  console.log('   Super Admin: admin@system.com / admin123');
  console.log('   Admin: john.admin@hospital.com / admin123');
  console.log('   Doctor: alice.smith@hospital.com / doctor123');
  console.log('   Staff: sarah.wilson@hospital.com / staff123');
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });