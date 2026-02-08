
"use client";

import * as React from "react";
import type { CharterTour } from "@/lib/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

const CharterTourListItem = ({
  tour,
  isSelected,
  onClick,
}: {
  tour: CharterTour;
  isSelected: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      className={cn(
        "flex w-full flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all",
        isSelected ? "bg-muted border-primary" : "hover:bg-accent"
      )}
      onClick={onClick}
    >
      <div className="flex w-full items-center">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={tour.avatar_url || ''} alt={tour.name || 'Avatar'} />
            <AvatarFallback>{tour.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div className="font-semibold">{tour.name || "N/A"}</div>
        </div>
        <div className="ml-auto text-xs text-muted-foreground">
          {format(new Date(tour.created_at), "dd MMM")}
        </div>
      </div>
      <div className="line-clamp-1 text-xs">{tour.travel_purpose || "No purpose specified"}</div>
      <div className="flex w-full items-center gap-2">
        <p className="line-clamp-1 text-xs text-muted-foreground">{tour.interested_locations}</p>
      </div>
    </button>
  );
};

type InquiryListProps = {
  tours: CharterTour[];
  selectedTour: CharterTour | null;
  onSelect: (tour: CharterTour) => void;
  loading: boolean;
};

export function InquiryList({ tours, selectedTour, onSelect, loading }: InquiryListProps) {
  return (
    <div className="space-y-4 p-4">
      {loading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-[76px] w-full" />)}
        </div>
      ) : tours.length > 0 ? (
        tours.map((tour) => (
          <CharterTourListItem
            key={tour.id}
            tour={tour}
            isSelected={selectedTour?.id === tour.id}
            onClick={() => onSelect(tour)}
          />
        ))
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          No inquiries yet.
        </div>
      )}
    </div>
  );
}
