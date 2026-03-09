import type { Request, Response } from 'express';
export declare const createDepartment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getDepartments: (req: Request, res: Response) => Promise<void>;
export declare const getDepartmentById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateDepartment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteDepartment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const assignEmployeeToDepartment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const removeEmployeeFromDepartment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getEmployeesWithoutDepartment: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=department.controller.d.ts.map