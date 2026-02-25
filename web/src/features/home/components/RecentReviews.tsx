import { Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Review {
  id: string;
  authorName: string;
  authorInitials: string;
  rating: number;
  comment: string;
  timeAgo: string;
}

interface RecentReviewsProps {
  reviews: Review[];
}

export default function RecentReviews({ reviews }: RecentReviewsProps) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded bg-[#2D5A40] p-1.5">
            <MessageSquare className="size-4 text-white" />
          </div>
          <h2 className="text-lg font-bold text-stone-900">Recent Reviews</h2>
        </div>
        <Button variant="link" className="h-auto p-0 text-sm">
          View All
        </Button>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="rounded-lg border border-stone-200 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#2D5A40] text-sm font-semibold text-white">
                {review.authorInitials}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-900">
                    {review.authorName}
                  </span>
                  <span className="text-xs text-stone-500">
                    {review.timeAgo}
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`size-3 ${
                        i < review.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-stone-300"
                      }`}
                    />
                  ))}
                </div>

                <p className="mt-2 text-sm text-stone-700">{review.comment}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
