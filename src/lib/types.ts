import type { FieldValue } from "firebase/firestore";

export interface Product {
    id: string;
    name: string;
    imageUrl: string;
    
    // Computed weighted averages (registeredSum*2 + anonymousSum) / (registeredCount*2 + anonymousCount)
    avgSafety: number;
    avgTaste: number;
    voteCount: number; // Total votes (registered + anonymous)
    
    // Registered user vote tracking (2x weight)
    registeredVoteCount: number;
    registeredSafetySum: number;
    registeredTasteSum: number;
    
    // Anonymous user vote tracking (1x weight)
    anonymousVoteCount: number;
    anonymousSafetySum: number;
    anonymousTasteSum: number;
    
    // Future fields - placeholders
    ingredients?: string[];
    backImageUrl?: string;
    price?: number;
    currency?: string;
    purchaseLocation?: string;
    
    // Metadata
    createdAt?: FieldValue;
    createdBy?: string;
}

export interface Vote {
    userId: string;
    safety: number;
    taste: number;
    isRegistered: boolean; // true if user signed in with Google, false if anonymous
    votedAt: FieldValue; // When the vote was cast (used for time-decay weighting)
    createdAt: FieldValue;
    updatedAt?: FieldValue;
}
