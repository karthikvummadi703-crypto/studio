export interface Recommendation {
  action: string;
  impactLevel: 'Low' | 'Medium' | 'High';
  difficultyLevel: 'Easy' | 'Moderate' | 'Hard';
  estimatedCarbonSavings: string;
}

export interface GenerateReductionPlanInput {
  totalEmissions: number;
  emissionsBreakdown: {
    transportation: number;
    homeEnergy: number;
    food: number;
    lifestyle: number;
  };
}

export interface GenerateReductionPlanOutput {
  personalizedAnalysis: string;
  weeklyActionPlan: string;
  monthlyImprovementStrategy: string;
  transportationRecommendations: Recommendation[];
  homeEnergyRecommendations: Recommendation[];
  foodRecommendations: Recommendation[];
  lifestyleRecommendations: Recommendation[];
}
