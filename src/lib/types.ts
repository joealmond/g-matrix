import type { FieldValue } from "firebase/firestore";

export interface Product {
    id: string;
    name: string;
    imageUrl: string;
    avgSafety: number;
    avgTaste: number;
    voteCount: number;
}

export interface Vote {
    userId: string;
    safety: number;
    taste: number;
    createdAt: FieldValue;
    updatedAt?: FieldValue;
}
