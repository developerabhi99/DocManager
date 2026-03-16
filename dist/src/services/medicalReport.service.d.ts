export declare const getPatientMedicalReportGroups: (patientId: string) => Promise<({
    reports: ({
        doctor: {
            email: string;
            id: string;
            name: string;
        };
        appointment: {
            patient: {
                email: string | null;
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                phone: string | null;
                address: string | null;
                age: number | null;
                gender: string | null;
            };
            doctor: {
                email: string;
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            patientId: string;
            doctorId: string;
            dateTime: Date;
            notes: string | null;
            visitNumber: number;
            referredTo: string | null;
            referredFrom: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        doctorId: string;
        notes: string | null;
        referredTo: string | null;
        appointmentId: string;
        diagnosis: string | null;
        symptoms: string | null;
        treatment: string | null;
        prescription: string | null;
        formData: import("@prisma/client/runtime/client").JsonValue | null;
        vitalSigns: import("@prisma/client/runtime/client").JsonValue | null;
        labResults: import("@prisma/client/runtime/client").JsonValue | null;
        imaging: import("@prisma/client/runtime/client").JsonValue | null;
        isReferred: boolean;
        referralReason: string | null;
        referralNotes: string | null;
        medicalReportGroupId: string | null;
        reportUrl: string | null;
    })[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    description: string | null;
    title: string | null;
    status: string;
    startDate: Date;
    endDate: Date | null;
    patientId: string;
})[]>;
export declare const getMedicalReportGroupById: (reportGroupId: string) => Promise<({
    patient: {
        email: string | null;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        address: string | null;
        age: number | null;
        gender: string | null;
    };
    reports: ({
        doctor: {
            email: string;
            id: string;
            name: string;
        };
        appointment: {
            doctor: {
                email: string;
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            patientId: string;
            doctorId: string;
            dateTime: Date;
            notes: string | null;
            visitNumber: number;
            referredTo: string | null;
            referredFrom: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        doctorId: string;
        notes: string | null;
        referredTo: string | null;
        appointmentId: string;
        diagnosis: string | null;
        symptoms: string | null;
        treatment: string | null;
        prescription: string | null;
        formData: import("@prisma/client/runtime/client").JsonValue | null;
        vitalSigns: import("@prisma/client/runtime/client").JsonValue | null;
        labResults: import("@prisma/client/runtime/client").JsonValue | null;
        imaging: import("@prisma/client/runtime/client").JsonValue | null;
        isReferred: boolean;
        referralReason: string | null;
        referralNotes: string | null;
        medicalReportGroupId: string | null;
        reportUrl: string | null;
    })[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    description: string | null;
    title: string | null;
    status: string;
    startDate: Date;
    endDate: Date | null;
    patientId: string;
}) | null>;
export declare const createMedicalReportGroup: (data: {
    patientId: string;
    title: string;
    description?: string;
}) => Promise<{
    patient: {
        email: string | null;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        address: string | null;
        age: number | null;
        gender: string | null;
    };
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    description: string | null;
    title: string | null;
    status: string;
    startDate: Date;
    endDate: Date | null;
    patientId: string;
}>;
export declare const updateMedicalReportGroup: (reportGroupId: string, data: {
    title?: string;
    description?: string;
    status?: string;
    endDate?: Date;
}) => Promise<{
    patient: {
        email: string | null;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        address: string | null;
        age: number | null;
        gender: string | null;
    };
    reports: ({
        doctor: {
            email: string;
            id: string;
            name: string;
        };
        appointment: {
            doctor: {
                email: string;
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            patientId: string;
            doctorId: string;
            dateTime: Date;
            notes: string | null;
            visitNumber: number;
            referredTo: string | null;
            referredFrom: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        doctorId: string;
        notes: string | null;
        referredTo: string | null;
        appointmentId: string;
        diagnosis: string | null;
        symptoms: string | null;
        treatment: string | null;
        prescription: string | null;
        formData: import("@prisma/client/runtime/client").JsonValue | null;
        vitalSigns: import("@prisma/client/runtime/client").JsonValue | null;
        labResults: import("@prisma/client/runtime/client").JsonValue | null;
        imaging: import("@prisma/client/runtime/client").JsonValue | null;
        isReferred: boolean;
        referralReason: string | null;
        referralNotes: string | null;
        medicalReportGroupId: string | null;
        reportUrl: string | null;
    })[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    description: string | null;
    title: string | null;
    status: string;
    startDate: Date;
    endDate: Date | null;
    patientId: string;
}>;
export declare const getMedicalReportById: (reportId: string) => Promise<({
    medicalReportGroup: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string | null;
        status: string;
        startDate: Date;
        endDate: Date | null;
        patientId: string;
    } | null;
    doctor: {
        email: string;
        id: string;
        name: string;
    };
    appointment: {
        patient: {
            email: string | null;
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            phone: string | null;
            address: string | null;
            age: number | null;
            gender: string | null;
        };
        doctor: {
            email: string;
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        patientId: string;
        doctorId: string;
        dateTime: Date;
        notes: string | null;
        visitNumber: number;
        referredTo: string | null;
        referredFrom: string | null;
    };
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    doctorId: string;
    notes: string | null;
    referredTo: string | null;
    appointmentId: string;
    diagnosis: string | null;
    symptoms: string | null;
    treatment: string | null;
    prescription: string | null;
    formData: import("@prisma/client/runtime/client").JsonValue | null;
    vitalSigns: import("@prisma/client/runtime/client").JsonValue | null;
    labResults: import("@prisma/client/runtime/client").JsonValue | null;
    imaging: import("@prisma/client/runtime/client").JsonValue | null;
    isReferred: boolean;
    referralReason: string | null;
    referralNotes: string | null;
    medicalReportGroupId: string | null;
    reportUrl: string | null;
}) | null>;
export declare const updateMedicalReport: (reportId: string, data: {
    diagnosis?: string;
    symptoms?: string;
    treatment?: string;
    prescription?: string;
    notes?: string;
    reportUrl?: string;
    formData?: any;
    vitalSigns?: any;
    labResults?: any;
    imaging?: any;
    isReferred?: boolean;
    referredTo?: string;
    referralReason?: string;
    referralNotes?: string;
}) => Promise<{
    medicalReportGroup: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string | null;
        status: string;
        startDate: Date;
        endDate: Date | null;
        patientId: string;
    } | null;
    doctor: {
        email: string;
        id: string;
        name: string;
    };
    appointment: {
        patient: {
            email: string | null;
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            phone: string | null;
            address: string | null;
            age: number | null;
            gender: string | null;
        };
        doctor: {
            email: string;
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        patientId: string;
        doctorId: string;
        dateTime: Date;
        notes: string | null;
        visitNumber: number;
        referredTo: string | null;
        referredFrom: string | null;
    };
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    doctorId: string;
    notes: string | null;
    referredTo: string | null;
    appointmentId: string;
    diagnosis: string | null;
    symptoms: string | null;
    treatment: string | null;
    prescription: string | null;
    formData: import("@prisma/client/runtime/client").JsonValue | null;
    vitalSigns: import("@prisma/client/runtime/client").JsonValue | null;
    labResults: import("@prisma/client/runtime/client").JsonValue | null;
    imaging: import("@prisma/client/runtime/client").JsonValue | null;
    isReferred: boolean;
    referralReason: string | null;
    referralNotes: string | null;
    medicalReportGroupId: string | null;
    reportUrl: string | null;
}>;
export declare const getPatientVisitHistory: (patientId: string) => Promise<({
    patient: {
        email: string | null;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        address: string | null;
        age: number | null;
        gender: string | null;
    };
    reports: ({
        medicalReportGroup: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            title: string | null;
            status: string;
            startDate: Date;
            endDate: Date | null;
            patientId: string;
        } | null;
        doctor: {
            email: string;
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        doctorId: string;
        notes: string | null;
        referredTo: string | null;
        appointmentId: string;
        diagnosis: string | null;
        symptoms: string | null;
        treatment: string | null;
        prescription: string | null;
        formData: import("@prisma/client/runtime/client").JsonValue | null;
        vitalSigns: import("@prisma/client/runtime/client").JsonValue | null;
        labResults: import("@prisma/client/runtime/client").JsonValue | null;
        imaging: import("@prisma/client/runtime/client").JsonValue | null;
        isReferred: boolean;
        referralReason: string | null;
        referralNotes: string | null;
        medicalReportGroupId: string | null;
        reportUrl: string | null;
    })[];
    doctor: {
        email: string;
        id: string;
        name: string;
    };
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: string;
    patientId: string;
    doctorId: string;
    dateTime: Date;
    notes: string | null;
    visitNumber: number;
    referredTo: string | null;
    referredFrom: string | null;
})[]>;
export declare const getAllMedicalReportGroups: (filters?: {
    status?: string;
    patientId?: string;
    startDate?: Date;
    endDate?: Date;
}) => Promise<({
    patient: {
        email: string | null;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        address: string | null;
        age: number | null;
        gender: string | null;
    };
    reports: ({
        doctor: {
            email: string;
            id: string;
            name: string;
        };
        appointment: {
            doctor: {
                email: string;
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            patientId: string;
            doctorId: string;
            dateTime: Date;
            notes: string | null;
            visitNumber: number;
            referredTo: string | null;
            referredFrom: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        doctorId: string;
        notes: string | null;
        referredTo: string | null;
        appointmentId: string;
        diagnosis: string | null;
        symptoms: string | null;
        treatment: string | null;
        prescription: string | null;
        formData: import("@prisma/client/runtime/client").JsonValue | null;
        vitalSigns: import("@prisma/client/runtime/client").JsonValue | null;
        labResults: import("@prisma/client/runtime/client").JsonValue | null;
        imaging: import("@prisma/client/runtime/client").JsonValue | null;
        isReferred: boolean;
        referralReason: string | null;
        referralNotes: string | null;
        medicalReportGroupId: string | null;
        reportUrl: string | null;
    })[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    description: string | null;
    title: string | null;
    status: string;
    startDate: Date;
    endDate: Date | null;
    patientId: string;
})[]>;
//# sourceMappingURL=medicalReport.service.d.ts.map