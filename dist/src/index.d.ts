import multer from 'multer';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
export declare const prisma: PrismaClient<{
    adapter: PrismaPg;
}, never, import("@prisma/client/runtime/client").DefaultArgs>;
declare const upload: multer.Multer;
export { upload };
//# sourceMappingURL=index.d.ts.map