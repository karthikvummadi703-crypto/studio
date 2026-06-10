"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function InsightCategoryCard({ title, icon: Icon, items }: any) {
  if (!items || items.length === 0) return null;
  return (
    <Card className="glass-card border-none">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="font-headline text-foreground">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item: any, idx: number) => (
          <div key={idx} className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 space-y-2">
            <div className="flex justify-between items-start">
              <p className="font-bold text-sm text-foreground">{item.action}</p>
              <Badge variant="outline" className="text-[10px] uppercase font-bold border-primary/20 text-primary">{item.impactLevel} Impact</Badge>
            </div>
            <div className="flex justify-between items-center text-xs text-zinc-500">
               <span className="font-medium">Difficulty: {item.difficultyLevel}</span>
               <span className="text-primary font-bold font-mono">{item.estimatedCarbonSavings}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
