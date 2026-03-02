import type { Request, Response } from "express";
export declare function getEmployeeSchedules(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function upsertEmployeeSchedule(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteEmployeeSchedule(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getAllEmployeeSchedules(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createDefaultSchedule(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createDefaultSchedulesForAll(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=employeeSchedule.controller.d.ts.map