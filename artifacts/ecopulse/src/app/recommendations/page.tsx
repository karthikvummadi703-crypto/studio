"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Car, Zap, Utensils, Trash2, Check } from 'lucide-react';

const RECOMMENDATIONS = {
  transport: [
    { title: 'Use Public Transport', desc: 'Swap one car trip per week for the bus or train.', impact: 'High', difficulty: 'Easy', savings: '450kg/yr' },
    { title: 'Carpooling', desc: 'Share your commute with a colleague.', impact: 'Medium', difficulty: 'Moderate', savings: '200kg/yr' },
    { title: 'EV Switch', desc: 'Consider an electric vehicle for your next car.', impact: 'Extreme', difficulty: 'Hard', savings: '2,400kg/yr' },
  ],
  energy: [
    { title: 'LED Lighting', desc: 'Replace all old bulbs with energy-efficient LEDs.', impact: 'Medium', difficulty: 'Easy', savings: '120kg/yr' },
    { title: 'Smart Thermostat', desc: 'Optimize your heating and cooling schedules.', impact: 'High', difficulty: 'Moderate', savings: '350kg/yr' },
    { title: 'Solar Panels', desc: 'Generate your own renewable energy.', impact: 'Extreme', difficulty: 'Hard', savings: '1,800kg/yr' },
  ],
  food: [
    { title: 'Meatless Mondays', desc: 'Go vegetarian for at least one day every week.', impact: 'Medium', difficulty: 'Easy', savings: '150kg/yr' },
    { title: 'Local Produce', desc: 'Buy seasonal food from local farmers.', impact: 'Medium', difficulty: 'Easy', savings: '80kg/yr' },
    { title: 'Plant-Based Diet', desc: 'Transition to a full plant-based lifestyle.', impact: 'High', difficulty: 'Moderate', savings: '800kg/yr' },
  ],
  waste: [
    { title: 'Composting', desc: 'Turn organic waste into nutrient-rich soil.', impact: 'Medium', difficulty: 'Easy', savings: '50kg/yr' },
    { title: 'Zero-Waste Shopping', desc: 'Use bulk stores and bring your own bags.', impact: 'Low', difficulty: 'Moderate', savings: '30kg/yr' },
  ]
};

export default function RecommendationsPage() {
  return (
    <div className="space-y-8 pb-10 animate-fade-in">
      <div>
        <h1 className="text-4xl font-headline font-bold text-foreground">Sustainability Advice</h1>
        <p className="text-zinc-600">Curated tips to help you lower your environmental footprint.</p>
      </div>

      <Tabs defaultValue="transport" className="w-full">
        <TabsList className="bg-white border border-zinc-100 p-1 rounded-xl h-auto mb-8 flex-wrap">
          <TabsTrigger value="transport" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 px-6 rounded-lg font-headline font-bold">
             <Car className="mr-2 h-4 w-4" /> Transport
          </TabsTrigger>
          <TabsTrigger value="energy" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 px-6 rounded-lg font-headline font-bold">
             <Zap className="mr-2 h-4 w-4" /> Energy
          </TabsTrigger>
          <TabsTrigger value="food" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 px-6 rounded-lg font-headline font-bold">
             <Utensils className="mr-2 h-4 w-4" /> Food
          </TabsTrigger>
          <TabsTrigger value="waste" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 px-6 rounded-lg font-headline font-bold">
             <Trash2 className="mr-2 h-4 w-4" /> Waste
          </TabsTrigger>
        </TabsList>

        {Object.entries(RECOMMENDATIONS).map(([key, items]) => (
          <TabsContent key={key} value={key}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item, idx) => (
                <Card key={idx} className="glass-card group">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                       <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-bold uppercase text-[10px] tracking-widest">{item.impact} Impact</Badge>
                       <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                         <Check className="h-4 w-4" />
                       </Button>
                    </div>
                    <CardTitle className="font-headline text-foreground">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-sm text-zinc-600 leading-relaxed">{item.desc}</p>
                    <div className="flex justify-between items-center pt-4 border-t border-black/5">
                      <div className="text-xs space-y-1">
                        <p className="text-zinc-500 uppercase font-black tracking-tighter">Difficulty</p>
                        <p className="font-bold text-foreground">{item.difficulty}</p>
                      </div>
                      <div className="text-right text-xs space-y-1">
                        <p className="text-zinc-500 uppercase font-black tracking-tighter">Estimated Saving</p>
                        <p className="text-primary font-mono font-black">{item.savings}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
