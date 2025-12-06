import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { StatCard as StatCardType } from '@/lib/types';

export function StatCard({ card }: { card: StatCardType }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
        <div className="text-muted-foreground">{card.icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{card.value}</div>
        {card.change && (
          <p className="text-xs text-muted-foreground">{card.change} from last month</p>
        )}
      </CardContent>
    </Card>
  );
}
