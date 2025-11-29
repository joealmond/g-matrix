export type ImageAnalysisSuccessState = {
  productName: string;
  error: null;
};

export type ImageAnalysisErrorState = {
  productName: null;
  error: string;
}

export type ImageAnalysisState = ImageAnalysisSuccessState | ImageAnalysisErrorState;


export const initialState: ImageAnalysisState = {
  productName: null,
  error: null,
};
