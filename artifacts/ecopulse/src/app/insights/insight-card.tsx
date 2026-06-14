"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { LucideIcon } from 'lucide-react';

interface Recommendation {
  action: string;
  impactLevel: string;
  difficultyLevel: string;
  estimatedCarbonSavings: string;
}

interface InsightCategoryCardProps {
  title: string;
  icon: LucideIcon;
  items: Recommendation[];
}

/**
 * Renders a category of AI-generated sustainability recommendations.
 * Fully keyboard-navigable with screen-reader labels on every element.
 */
export default function InsightCategoryCard({
  title,
  icon: Icon,
  items,
}: InsightCategoryCardProps) {
  if (!items || items.length === 0) return null;

  return (
    <Card className="glass-card border-none" aria-label={`${title} recommendations`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg" aria-hidden="true">
            <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <CardTitle className="font-headline text-foreground">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4" aria-label={`${title} action list`}>
          {items.map((item, idx) => (
            <li
              key={idx}
              className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 space-y-2"
              aria-label={`${item.action}, ${item.impactLevel} impact, ${item.difficultyLevel} difficulty`}
            >
              <div className="flex justify-between items-start gap-2">
                <p className="font-bold text-sm text-foreground">{item.action}</p>
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase font-bold border-primary/20 text-primary shrink-0"
                  aria-label={`Impact level: ${item.impactLevel}`}
                >
                  {item.impactLevel} Impact
                </Badge>
              </div>
              <div className="flex justify-between items-center text-xs text-zinc-500">
                <span className="font-medium">Difficulty: {item.difficultyLevel}</span>
                <span
                  className="text-primary font-bold font-mono"
                  aria-label={`Estimated carbon savings: ${item.estimatedCarbonSavings}`}
                >
                  {item.estimatedCarbonSavings}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
