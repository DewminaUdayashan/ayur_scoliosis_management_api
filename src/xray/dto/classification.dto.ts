export interface ScoliosisConditionResponse {
  predicted_class: 'scoliosis' | 'normal';
  confidence: string;
}

export interface ScoliosisCurveResponse {
  predicted_class: 'S-Curve' | 'C-Curve' | 'normal';
  confidence: string;
}

export interface ClassificationResult {
  condition: ScoliosisConditionResponse;
  curve?: ScoliosisCurveResponse; // Only available if condition is scoliosis
  timestamp: Date;
}
