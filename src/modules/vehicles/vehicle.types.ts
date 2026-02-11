import { VehicleType, DocumentType } from '@prisma/client';

/* ================= DRAFT DOCUMENT ================= */
export interface DraftDocument {
    imageUrl: string;
    documentType: DocumentType;
}

/* ================= DRAFT VEHICLE (Redis) ================= */
export interface DraftVehicle {
    userId: string;
    step: number;
    createdAt: string;
    updatedAt: string;

    // Step 1 — License
    licenseCountry?: string;
    licenseNumber?: string;

    // Step 2 — Vehicle Details
    brand?: string;
    model_num?: string;
    model_name?: string;
    type?: VehicleType;
    color?: string;
    year?: number;

    // Step 3 — Documents (multiple)
    documents: DraftDocument[];
}

/* ================= STEP INPUT TYPES ================= */
export interface LicenseInput {
    licenseCountry: string;
    licenseNumber: string;
}

export interface VehicleDetailsInput {
    brand: string;
    model_num: string;
    model_name: string;
    type: VehicleType;
    color: string;
    year: number;
}
