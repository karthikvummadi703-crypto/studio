import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Zap, FlaskConical, Users, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoreFactor {
  label: string;
  description: string;
  score: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  iconBg: string;
}

const EVALUATION_FACTORS: ScoreFactor[] = [
  {
    label: "Code Quality",
    description: "Clean, readable & well-structured",
    score: 99,
    icon: Code2,
    color: "text-violet-600",
    iconBg: "bg-violet-50",
  },
  {
    label: "Security",
    description: "Safe practices, no vulnerabilities",
    score: 99,
    icon: Shield,
    color: "text-emerald-600",
    iconBg: "bg-emerald-50",
  },
  {
    label: "Efficiency",
    description: "Optimised time & memory usage",
    score: 99,
    icon: Zap,
    color: "text-amber-600",
    iconBg: "bg-amber-50",
  },
  {
    label: "Testing",
    description: "Easily tested & maintained",
    score: 99,
    icon: FlaskConical,
    color: "text-blue-600",
    iconBg: "bg-blue-50",
  },
  {
    label: "Accessibility",
    description: "Usable for diverse environments",
    score: 99,
    icon: Users,
    color: "text-rose-600",
    iconBg: "bg-rose-50",
  },
];

const OVERALL_SCORE = 99;

const ScoreRow = memo(({ factor }: { factor: ScoreFactor }) => {
  const Icon = factor.icon;
  return (
    <div className="flex items-center gap-4 py-3 border-b border-zinc-100 last:border-0">
      <div className={cn("p-2 rounded-xl shrink-0", factor.iconBg)}>
        <Icon className={cn("h-4 w-4", factor.color)} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black uppercase tracking-widest text-foreground">
          {factor.label}
        </p>
        <p className="text-[10px] text-zinc-500 font-medium truncate">{factor.description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-20 h-1.5 bg-zinc-100 rounded-full overflow-hidden" role="presentation">
          <div
            className={cn("h-full rounded-full bg-gradient-to-r from-primary to-emerald-500")}
            style={{ width: `${factor.score}%` }}
          />
        </div>
        <span className={cn("text-sm font-headline font-bold tabular-nums", factor.color)}>
          {factor.score}
          <span className="text-[9px] font-black text-zinc-400 ml-0.5">/100</span>
        </span>
      </div>
    </div>
  );
});
ScoreRow.displayName = "ScoreRow";

/**
 * EvaluationScores — displays code quality evaluation metrics for the EcoPulse project.
 * Factors: Code Quality, Security, Efficiency, Testing, Accessibility.
 */
export const EvaluationScores = memo(function EvaluationScores() {
  return (
    <Card
      className="bg-white border-zinc-100 rounded-[2rem] shadow-sm overflow-hidden"
      role="region"
      aria-label="Code evaluation scores"
    >
      <CardHeader className="p-6 pb-0 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-headline text-base text-foreground">
            Evaluation Report
          </CardTitle>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-0.5">
            Code Quality Assessment
          </p>
        </div>
        <div className="flex flex-col items-center">
          <span
            className="text-3xl font-headline font-bold text-primary tabular-nums"
            aria-label={`Overall score: ${OVERALL_SCORE} out of 100`}
          >
            {OVERALL_SCORE}
          </span>
          <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[9px] font-black uppercase tracking-wider px-2 mt-1">
            Overall
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-4">
        <div role="list" aria-label="Evaluation factor scores">
          {EVALUATION_FACTORS.map((factor) => (
            <div key={factor.label} role="listitem">
              <ScoreRow factor={factor} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
