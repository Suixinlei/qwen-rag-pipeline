interface AnalysisContent {
  summary?: string;
  core_critique?: string;
}

export interface IAnalysis {
  content?: {
    analysis?: AnalysisContent;
  };
}