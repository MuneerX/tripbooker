"use client";

import * as React from "react";
import { getCharterTours } from "@/lib/supabase/queries";
import type { CharterTour } from "@/lib/types";
import { format } from "date-fns";
import { cn, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  Phone,
  Clock,
  Users,
  Calendar,
  Check,
  X,
  MapPin,
  Car,
  Hotel,
  Utensils,
  Camera,
  Briefcase,
  Star,
  Wallet,
  BookText,
  UserCheck,
  Plane,
  Baby,
  Wheelchair,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-1" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

function BooleanDetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-1" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        {value ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
            <Check className="h-4 w-4" /> Yes
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-sm font-medium text-red-600">
            <X className="h-4 w-4" /> No
          </span>
        )}
      </div>
    </div>
  );
}

const CharterTourDetail = ({ tour }: { tour: CharterTour | null }) => {
  if (!tour) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-muted/50 p-8 text-center">
        <Plane className="h-16 w-16 text-muted-foreground" />
        <h2 className="mt-6 text-xl font-medium">No Charter Selected</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Select a charter from the list to view its details.
        </p>
      </div>
    );
  }
  
  const renderTextList = (text: string | null | undefined, title: string) => {
    if (!text) return null;
    const items = text.split(/[\n,]+/).map(p => p.trim()).filter(p => p);
    return (
      <div>
        <h3 className="font-semibold mb-2">{title}</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold">{tour.name || "Charter Inquiry"}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{format(new Date(tour.created_at), "PPP p")}</span>
            <Badge variant="outline">{tour.status || "New"}</Badge>
          </div>
        </header>

        <Separator />

        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DetailItem icon={UserCheck} label="Full Name" value={tour.name} />
            <DetailItem icon={Mail} label="Email" value={tour.email} />
            <DetailItem icon={Phone} label="Mobile Number" value={tour.mobile_number} />
            <DetailItem icon={Phone} label="WhatsApp" value={tour.whatsapp_number} />
            <DetailItem icon={Clock} label="Best time to call" value={tour.time_to_call} />
          </div>
        </div>

        <Separator />

        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Travel Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DetailItem icon={Plane} label="Travel Style" value={tour.travel_style} />
            <DetailItem icon={Clock} label="Travel Pace" value={tour.travel_pace} />
            <DetailItem icon={Briefcase} label="Purpose of Travel" value={tour.travel_purpose} />
            <DetailItem icon={Calendar} label="Duration" value={`${tour.number_of_days} Days / ${tour.number_of_nights} Nights`} />
            <BooleanDetailItem icon={Calendar} label="Date Flexible" value={tour.date_flexible} />
            {renderTextList(tour.interested_locations, 'Interested Locations')}
          </div>
        </div>
        
        <Separator />

        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Guest Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DetailItem icon={Users} label="Adults" value={tour.number_of_adults} />
            <DetailItem icon={Users} label="Children" value={tour.number_of_children} />
            <BooleanDetailItem icon={Baby} label="Infant Travelling" value={tour.infant_travelling} />
            <BooleanDetailItem icon={UserCheck} label="Senior Citizen Travelling" value={tour.senior_citizen_travelling} />
            <BooleanDetailItem icon={Wheelchair} label="Mobility Assistance" value={tour.mobility_assistance} />
          </div>
        </div>

        <Separator />
        
        <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Accommodation & Transport</h2>
              <div className="grid grid-cols-1 gap-6">
                <DetailItem icon={Car} label="Vehicle Requirements" value={tour.vehicle_requirements} />
                <DetailItem icon={Car} label="Vehicle Brand Preference" value={tour.vehicle_brand_preference} />
                <DetailItem icon={UserCog} label="Driver Language" value={tour.driver_language_preference} />
                <Separator />
                <DetailItem icon={Hotel} label="Hotel Category" value={tour.hotel_category} />
                <DetailItem icon={Hotel} label="Room Type" value={tour.room_type} />
                <DetailItem icon={Hotel} label="Number of Rooms" value={tour.number_of_rooms} />
                <DetailItem icon={Utensils} label="Meal Plan" value={tour.meal_plan} />
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Additional Services</h2>
              <div className="grid grid-cols-1 gap-6">
                 <BooleanDetailItem icon={UserCog} label="Tour Guide Needed" value={tour.need_tour_guide} />
                 <BooleanDetailItem icon={Car} label="Pickup/Drop Needed" value={tour.need_pickup} />
                 <BooleanDetailItem icon={Utensils} label="Food Arrangements" value={tour.need_food} />
                 <BooleanDetailItem icon={Camera} label="Photographer Needed" value={tour.need_photographer} />
                 <BooleanDetailItem icon={Star} label="VIP Services" value={tour.need_vip} />
              </div>
            </div>
        </div>
        
        <Separator />
        
        <div className="space-y-6">
            <h2 className="text-lg font-semibold">Activities & Budget</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {renderTextList(tour.interested_activities, 'Interested Activities')}
                <DetailItem icon={Wallet} label="Budget" value={tour.budget ? formatCurrency(tour.budget as number) : 'N/A'} />
                <DetailItem icon={BookText} label="Payment Preference" value={tour.payment_preference} />
            </div>
        </div>

        <Separator />

        <div className="space-y-6">
            <h2 className="text-lg font-semibold">Notes & Inclusions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {renderTextList(tour.things_to_include, 'Things to Include')}
                {renderTextList(tour.things_to_exclude, 'Things to Exclude')}
            </div>
            {tour.additional_notes && (
                 <div className="space-y-2">
                    <h3 className="font-semibold">Additional Notes</h3>
                    <p className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">{tour.additional_notes}</p>
                 </div>
            )}
        </div>

      </div>
    </ScrollArea>
  );
};

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
        isSelected ? "bg-muted" : "hover:bg-accent"
      )}
      onClick={onClick}
    >
      <div className="flex w-full items-center">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
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
        <Badge variant={tour.status === 'completed' ? 'default' : 'outline'}>{tour.status || "New"}</Badge>
        <p className="line-clamp-1 text-xs text-muted-foreground">{tour.interested_locations}</p>
      </div>
    </button>
  );
};


export default function CharterToursPage() {
  const [tours, setTours] = React.useState<CharterTour[]>([]);
  const [selectedTour, setSelectedTour] = React.useState<CharterTour | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchTours = async () => {
      setLoading(true);
      try {
        const data = await getCharterTours();
        setTours(data);
        if (data.length > 0) {
          setSelectedTour(data[0]);
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Failed to load charters",
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchTours();
  }, [toast]);

  return (
    <div className="grid h-[calc(100vh_-_theme(spacing.16))] w-full md:grid-cols-[320px_1fr]">
      <div className="flex flex-col border-r bg-muted/40">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <h2 className="text-lg font-semibold">Charter Inquiries</h2>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {loading ? (
                <div className="p-2 space-y-3">
                    {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
            ) : tours.length > 0 ? (
                tours.map((tour) => (
                    <CharterTourListItem
                        key={tour.id}
                        tour={tour}
                        isSelected={selectedTour?.id === tour.id}
                        onClick={() => setSelectedTour(tour)}
                    />
                ))
            ) : (
                <div className="p-8 text-center text-muted-foreground">
                    No inquiries yet.
                </div>
            )}
           </div>
        </ScrollArea>
      </div>
      <div className="flex flex-col">
        <CharterTourDetail tour={selectedTour} />
      </div>
    </div>
  );
}
