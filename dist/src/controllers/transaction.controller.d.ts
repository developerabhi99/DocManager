import type { Request, Response } from "express";
export declare function createTransaction(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateTransactionStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getPatientTransactions(req: Request, res: Response): Promise<void>;
export declare function getAllTransactions(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=transaction.controller.d.ts.map