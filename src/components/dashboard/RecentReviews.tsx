
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import type { Review } from '@/lib/types';
import { format } from 'date-fns';

export function RecentReviews({ reviews }: { reviews: Review[] }) {
  const recentReviews = reviews.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Reviews</CardTitle>
        <CardDescription>Latest feedback from your customers.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {recentReviews.length > 0 ? (
          recentReviews.map(review => (
            <div key={review.id} className="flex items-start gap-4">
              <Avatar className="h-10 w-10 border">
                <AvatarImage src={`https://i.pravatar.cc/150?u=${review.user_id}`} />
                <AvatarFallback>{review.customer_name?.charAt(0) ?? 'A'}</AvatarFallback>
              </Avatar>
              <div className="grid gap-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{review.customer_name}</p>
                  <div className="flex items-center gap-0.5 text-muted-foreground">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-muted stroke-muted-foreground'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{review.review_text}</p>
                 <p className="text-xs text-muted-foreground mt-1">{format(new Date(review.created_at), "PPP")}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No reviews yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
