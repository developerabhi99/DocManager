import type { Request, Response } from "express";
export declare function getMyAppointments(req: Request, res: Response): Promise<void>;
export declare function getAppointmentDetails(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function completeAppointment(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getPatientHistory(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getDoctorsAndPatients(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getDoctorSchedule(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=myAppointments.controller.d.ts.map