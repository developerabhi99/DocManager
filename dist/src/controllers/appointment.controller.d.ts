import type { Request, Response } from 'express';
interface MulterRequest extends Express.Request {
    files?: {
        [fieldname: string]: Express.Multer.File[];
    } | undefined;
    body?: any;
    params?: any;
}
export declare const createPatient: (req: Request, res: Response) => Promise<void>;
export declare const listPatients: (req: Request, res: Response) => Promise<void>;
export declare const createAppointment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const listAppointments: (req: Request, res: Response) => Promise<void>;
export declare const listDoctors: (req: Request, res: Response) => Promise<void>;
export declare const processPayment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const completeAppointment: (req: MulterRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createReferralAppointment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const referAppointment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=appointment.controller.d.ts.map