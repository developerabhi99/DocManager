import type { AuthRequest } from "./auth.middleware.js";
import type { Response, NextFunction } from "express";
export declare function hasPermission(permissionKey: string): (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=permission.middleware.d.ts.map