
"use client";

import * as React from "react";
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
  Accessibility,
  UserCog,
  Bell,
  Menu,
} from "lucide-react";
import { format } from "date-fns";
import { formatCurrency, cn } from "@/lib/utils";
import type { CharterTour } from "@/lib/types";

import { getCharterTours } from "@/lib/supabase/queries";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";


// --- Detail Item Components ---
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

// --- Charter Tour Detail View Component ---
const CharterTourDetail = ({ tour }: { tour: CharterTour }) => {
  
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
    <Card>
        <CardHeader>
             <div className="flex items-start justify-between">
                <div className="grid gap-2">
                    <CardTitle className="text-xl flex items-center gap-3">
                       <Avatar className="h-10 w-10">
                            <AvatarImage src={tour.avatar_url || ''} alt={tour.name || 'Avatar'} />
                            <AvatarFallback>{tour.name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        {tour.name || "Charter Inquiry"}
                    </CardTitle>
                    <CardDescription>
                        Inquiry received on {format(new Date(tour.created_at), "PPP p")}
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <Card className="bg-muted/30">
                        <CardHeader><CardTitle className="text-base">Contact Information</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <DetailItem icon={UserCheck} label="Full Name" value={tour.name} />
                            <DetailItem icon={Mail} label="Email" value={tour.email} />
                            <DetailItem icon={Phone} label="Mobile Number" value={tour.mobile_number} />
                            <DetailItem icon={Phone} label="WhatsApp" value={tour.whatsapp_number} />
                            <DetailItem icon={Clock} label="Best time to call" value={tour.time_to_call} />
                        </CardContent>
                    </Card>
                    <Card className="bg-muted/30">
                        <CardHeader><CardTitle className="text-base">Travel Preferences</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-6">
                            <DetailItem icon={Plane} label="Travel Style" value={tour.travel_style} />
                            <DetailItem icon={Clock} label="Travel Pace" value={tour.travel_pace} />
                            <DetailItem icon={Briefcase} label="Purpose" value={tour.travel_purpose} />
                            <DetailItem icon={Calendar} label="Duration" value={`${tour.number_of_days}D / ${tour.number_of_nights}N`} />
                            <BooleanDetailItem icon={Calendar} label="Date Flexible" value={!!tour.date_flexible} />
                        </CardContent>
                    </Card>
                     <Card className="bg-muted/30">
                        <CardHeader><CardTitle className="text-base">Accommodation & Transport</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-6">
                            <DetailItem icon={Car} label="Vehicle" value={tour.vehicle_requirements} />
                            <DetailItem icon={Car} label="Brand Preference" value={tour.vehicle_brand_preference} />
                            <DetailItem icon={UserCog} label="Driver Language" value={tour.driver_language_preference} />
                            <DetailItem icon={Hotel} label="Hotel Category" value={tour.hotel_category} />
                            <DetailItem icon={Hotel} label="Room Type" value={tour.room_type} />
                            <DetailItem icon={Hotel} label="Number of Rooms" value={tour.number_of_rooms} />
                            <DetailItem icon={Utensils} label="Meal Plan" value={tour.meal_plan} />
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card className="bg-muted/30">
                        <CardHeader><CardTitle className="text-base">Guest Information</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-6">
                            <DetailItem icon={Users} label="Adults" value={tour.number_of_adults} />
                            <DetailItem icon={Users} label="Children" value={tour.number_of_children} />
                            <BooleanDetailItem icon={Baby} label="Infant" value={!!tour.infant_travelling} />
                            <BooleanDetailItem icon={UserCheck} label="Senior Citizen" value={!!tour.senior_citizen_travelling} />
                            <BooleanDetailItem icon={Accessibility} label="Mobility Needs" value={!!tour.mobility_assistance} />
                        </CardContent>
                    </Card>
                     <Card className="bg-muted/30">
                        <CardHeader><CardTitle className="text-base">Budget & Payment</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-6">
                            <DetailItem icon={Wallet} label="Budget" value={tour.budget ? formatCurrency(tour.budget as number) : 'N/A'} />
                            <DetailItem icon={BookText} label="Payment Method" value={tour.payment_preference} />
                        </CardContent>
                    </Card>
                     <Card className="bg-muted/30">
                        <CardHeader><CardTitle className="text-base">Additional Services</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-6">
                            <BooleanDetailItem icon={UserCog} label="Tour Guide" value={!!tour.need_tour_guide} />
                            <BooleanDetailItem icon={Car} label="Pickup/Drop" value={!!tour.need_pickup} />
                            <BooleanDetailItem icon={Utensils} label="Food" value={!!tour.need_food} />
                            <BooleanDetailItem icon={Camera} label="Photographer" value={!!tour.need_photographer} />
                            <BooleanDetailItem icon={Star} label="VIP Services" value={!!tour.need_vip} />
                        </CardContent>
                    </Card>
                </div>
            </div>
             <Separator className="my-6" />
             <div className="space-y-4">
                <CardTitle className="text-lg">Interests & Notes</CardTitle>
                <div className="grid md:grid-cols-2 gap-6">
                    {renderTextList(tour.interested_locations, 'Interested Locations')}
                    {renderTextList(tour.interested_activities, 'Interested Activities')}
                    {renderTextList(tour.things_to_include, 'Things to Include')}
                    {renderTextList(tour.things_to_exclude, 'Things to Exclude')}
                </div>
                {tour.additional_notes && (
                    <div className="space-y-2 pt-4">
                        <h3 className="font-semibold">Additional Notes</h3>
                        <p className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">{tour.additional_notes}</p>
                    </div>
                )}
            </div>
        </CardContent>
    </Card>
  );
};


const InquiryList = ({
  tours,
  selectedTour,
  onTourSelect,
}: {
  tours: CharterTour[];
  selectedTour: CharterTour | null;
  onTourSelect: (tour: CharterTour) => void;
}) => (
    <div className="space-y-4">
        <div className="px-4 py-2">
            <CardTitle>Charter Inquiries</CardTitle>
            <CardDescription>Select an inquiry to view details.</CardDescription>
        </div>
        <ScrollArea className="h-full max-h-[calc(100vh-12rem)]">
            <div className="space-y-3 px-4">
                {tours.map((tour) => (
                    <button
                    key={tour.id}
                    className={cn(
                        "w-full text-left p-3 rounded-lg border transition-colors",
                        selectedTour?.id === tour.id
                        ? "bg-muted border-primary shadow-sm"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => onTourSelect(tour)}
                    >
                        <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10 border">
                                <AvatarImage src={tour.avatar_url || ""} alt={tour.name || "U"} />
                                <AvatarFallback>{tour.name?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                            <div className="grid gap-0.5 flex-1 min-w-0">
                                <p className="font-semibold text-sm line-clamp-1">
                                    {tour.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {tour.travel_purpose}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {format(new Date(tour.created_at), "PPP")}
                                </p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </ScrollArea>
    </div>
);



// --- Main Page Component ---
export default function CharterToursPage() {
  const { toast } = useToast();
  const [tours, setTours] = React.useState<CharterTour[]>([]);
  const [selectedTour, setSelectedTour] = React.useState<CharterTour | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isListOpen, setIsListOpen] = React.useState(false);

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
          title: "Error fetching inquiries",
          description: error.message,
        });
      }
      setLoading(false);
    };
    fetchTours();
  }, [toast]);
  
  const renderSkeleton = () => (
    <div className="lg:grid lg:grid-cols-4 gap-8">
        <div className="hidden lg:block lg:col-span-1">
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-3">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-3">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                     <Skeleton className="h-40 w-full" />
                </CardContent>
            </Card>
        </div>
    </div>
  );


  return (
     <div className="h-full">
        {loading ? (
            renderSkeleton()
        ) : tours.length > 0 ? (
            <div className="flex flex-col lg:flex-row gap-8 items-start">
                
                {/* Mobile Header */}
                <div className="lg:hidden w-full flex items-center gap-4">
                     <Sheet open={isListOpen} onOpenChange={setIsListOpen}>
                        <SheetTrigger asChild>
                             <Button variant="outline" size="icon">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Open Inquiries List</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-full max-w-sm">
                           <InquiryList
                             tours={tours}
                             selectedTour={selectedTour}
                             onTourSelect={(tour) => {
                               setSelectedTour(tour);
                               setIsListOpen(false);
                             }}
                           />
                        </SheetContent>
                    </Sheet>
                    <h1 className="text-xl font-semibold">Charter Inquiry</h1>
                </div>

                {/* Left Column (Desktop) */}
                <div className="hidden lg:block lg:w-[320px] lg:sticky lg:top-8 flex-shrink-0">
                    <InquiryList
                        tours={tours}
                        selectedTour={selectedTour}
                        onTourSelect={setSelectedTour}
                    />
                </div>
                
                {/* Right Column (Details) */}
                <div className="flex-1 w-full min-w-0">
                    {selectedTour ? (
                        <CharterTourDetail tour={selectedTour} />
                    ) : (
                         <div className="hidden lg:flex text-center py-24 text-muted-foreground h-full flex-col items-center justify-center rounded-lg border-2 border-dashed">
                            <Bell className="mx-auto h-12 w-12" />
                            <h3 className="mt-4 text-lg font-semibold">Select an Inquiry</h3>
                            <p className="mt-2 text-sm">Choose an inquiry from the left to see its details.</p>
                        </div>
                    )}
                </div>

            </div>
        ) : (
            <div className="text-center py-24 text-muted-foreground">
              <Plane className="mx-auto h-12 w-12" />
              <h3 className="mt-4 text-lg font-semibold">No Charter Inquiries</h3>
              <p className="mt-2 text-sm">There are no new charter tour inquiries at this time.</p>
            </div>
        )}
    </div>
  );
}

    