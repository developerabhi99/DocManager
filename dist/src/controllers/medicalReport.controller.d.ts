import type { Request, Response } from "express";
export declare function createMedicalReportWithFile(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createMedicalReport(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateMedicalReport(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getMedicalReportByAppointment(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getPatientMedicalReports(req: Request, res: Response): Promise<void>;
export declare function referPatient(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPatientReports: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getReportGroupDetails: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createReportGroup: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateReportGroup: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getMedicalReportById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateMedicalReportEnhanced: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPatientVisitHistoryController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getAllReportGroups: (req: Request, res: Response) => Promise<void>;
export declare const getDashboardStats: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=medicalReport.controller.d.ts.map