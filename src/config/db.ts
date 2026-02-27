import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Working mock - replace with Prisma when DATABASE_URL is configured
// const prisma = {
//   user: {
//     findUnique: async ({ where }: any) => ({
//       id: "1",
//       name: "Test User",
//       email: where.email || "test@example.com",
//       password: "hashedpassword",
//       salt: "salt",
//       isActive: true,
//       role: {
//         name: "ADMIN",
//         permissions: [
//           {
//             permission: {
//               key: "VIEW_USERS"
//             }
//           }
//         ]
//       }
//     })
//   }
// };

export { prisma };
