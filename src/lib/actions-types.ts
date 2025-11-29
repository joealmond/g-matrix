export type ImageAnalysisSuccessState = {
  productName: string;
  imageUrl: string;
  error: null;
};

export type ImageAnalysisErrorState = {
  productName: null;
  imageUrl: null;
  error: string;
}

export type ImageAnalysisState = ImageAnalysisSuccessState | ImageAnalysisErrorState;


export const initialState: ImageAnalysisState = {
  productName: null,
  imageUrl: null,
  error: null,
};
