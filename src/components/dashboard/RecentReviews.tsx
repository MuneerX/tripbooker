import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import mockData from '@/lib/data';

export function RecentReviews() {
  const recentReviews = [...mockData.reviews]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Reviews</CardTitle>
        <CardDescription>Latest feedback from your customers.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {recentReviews.map(review => (
          <div key={review.id} className="flex items-start gap-4">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={`https://i.pravatar.cc/150?u=${review.userId}`} />
              <AvatarFallback>{review.customerName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{review.customerName}</p>
                <div className="flex items-center gap-0.5 text-muted-foreground">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-muted stroke-muted-foreground'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{review.reviewText}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
