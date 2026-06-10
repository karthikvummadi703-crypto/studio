import { Timestamp } from 'firebase/firestore';

/**
 * Valid user levels in the EcoPulse ecosystem.
 */
export type UserLevel = 'Seedling' | 'Eco Warrior' | 'Climate Champion' | 'Planet Guardian';

/**
 * Represents the primary user profile stored in Firestore.
 */
export interface UserProfile {
  id?: string;
  fullName: string;
  email: string;
  greenPoints: number;
  sustainabilityScore: number;
  level: UserLevel;
  createdAt: string | Timestamp | Date;
  completedChallenges: string[];
}

/**
 * A single message within a chat session.
 */
export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
}

/**
 * Represents a conversation session between a user and the AI advisor.
 */
export interface AIConversation {
  id?: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string | Timestamp | Date;
}

/**
 * A record of a carbon footprint calculation.
 */
export interface CalculatorRecord {
  id?: string;
  userId: string;
  start: string;
  destination: string;
  mode: string;
  distance: number;
  co2: number;
  impact: 'Low' | 'Medium' | 'High';
  points: number;
  timestamp: string | Timestamp | Date;
  breakdown?: {
    transportation: number;
    homeEnergy: number;
    food: number;
    lifestyle: number;
  };
}

/**
 * A single activity log entry.
 */
export interface Activity {
  id?: string;
  userId: string;
  type: 'initialization' | 'calculation' | 'milestone' | string;
  description: string;
  pointsEarned: number;
  timestamp: string | Timestamp | Date;
}

/**
 * A sustainability challenge definition.
 */
export interface Challenge {
  id: string;
  title: string;
  description: string;
  reward: number;
  icon: string;
}

/**
 * A single actionable recommendation from the AI.
 */
export interface Recommendation {
  action: string;
  impactLevel: 'Low' | 'Medium' | 'High';
  difficultyLevel: 'Easy' | 'Moderate' | 'Hard';
  estimatedCarbonSavings: string;
}

/**
 * The complete structure of an AI-generated carbon reduction plan.
 */
export interface CarbonReductionPlan {
  personalizedAnalysis: string;
  weeklyActionPlan: string;
  monthlyImprovementStrategy: string;
  transportationRecommendations: Recommendation[];
  homeEnergyRecommendations: Recommendation[];
  foodRecommendations: Recommendation[];
  lifestyleRecommendations: Recommendation[];
}
