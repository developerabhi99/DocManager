import type { Request, Response } from "express";
export declare function listUsers(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function listRoles(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function listPermissions(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function listUserTypes(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function createRole(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updateRolePermissions(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function createPermission(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function createUserType(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function createUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updateUserProfile(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=admin.controller.d.ts.map