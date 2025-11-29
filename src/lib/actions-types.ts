// This file is now largely superseded by the return type in actions.ts,
// but we keep it to avoid breaking imports unexpectedly.

export type ImageAnalysisState = {
  productName?: string | null;
  productId?: string | null;
  imageUrl?: string | null;
  error?: string | null;
  success: boolean;
};


export const initialState: ImageAnalysisState = {
  productName: null,
  imageUrl: null,
  error: null,
  success: false,
};
