import type { Request, Response } from "express";
export declare function getDoctorSchedules(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function upsertDoctorSchedule(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteDoctorSchedule(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getDoctorAvailability(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getAllDoctorSchedules(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=schedule.controller.d.ts.map