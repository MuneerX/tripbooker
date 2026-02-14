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
  Accessibility,
  UserCog,
  Menu,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { InquiryList } from "./_components/InquiryList";

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
    <div className="p-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{tour.name || "Charter Inquiry"}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">{format(new Date(tour.created_at), "PPP p")}</span>
          </div>
        </div>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Travel Preferences</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <DetailItem icon={Plane} label="Travel Style" value={tour.travel_style} />
                  <DetailItem icon={Clock} label="Travel Pace" value={tour.travel_pace} />
                  <DetailItem icon={Briefcase} label="Purpose of Travel" value={tour.travel_purpose} />
                  <DetailItem icon={Calendar} label="Duration" value={`${tour.number_of_days} Days / ${tour.number_of_nights} Nights`} />
                  <BooleanDetailItem icon={Calendar} label="Date Flexible" value={tour.date_flexible} />
              </CardContent>
            </Card>

             <Card>
              <CardHeader><CardTitle>Guest Information</CardTitle></CardHeader>
               <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <DetailItem icon={Users} label="Adults" value={tour.number_of_adults} />
                  <DetailItem icon={Users} label="Children" value={tour.number_of_children} />
                  <BooleanDetailItem icon={Baby} label="Infant Travelling" value={tour.infant_travelling} />
                  <BooleanDetailItem icon={UserCheck} label="Senior Citizen Travelling" value={tour.senior_citizen_travelling} />
                  <BooleanDetailItem icon={Accessibility} label="Mobility Assistance" value={tour.mobility_assistance} />
               </CardContent>
            </Card>
            
             <Card>
              <CardHeader><CardTitle>Accommodation & Transport</CardTitle></CardHeader>
               <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailItem icon={Car} label="Vehicle Requirements" value={tour.vehicle_requirements} />
                  <DetailItem icon={Car} label="Vehicle Brand Preference" value={tour.vehicle_brand_preference} />
                  <DetailItem icon={UserCog} label="Driver Language" value={tour.driver_language_preference} />
                  <DetailItem icon={Hotel} label="Hotel Category" value={tour.hotel_category} />
                  <DetailItem icon={Hotel} label="Room Type" value={tour.room_type} />
                  <DetailItem icon={Hotel} label="Number of Rooms" value={tour.number_of_rooms} />
                  <DetailItem icon={Utensils} label="Meal Plan" value={tour.meal_plan} />
               </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Additional Services</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BooleanDetailItem icon={UserCog} label="Tour Guide Needed" value={tour.need_tour_guide} />
                <BooleanDetailItem icon={Car} label="Pickup/Drop Needed" value={tour.need_pickup} />
                <BooleanDetailItem icon={Utensils} label="Food Arrangements" value={tour.need_food} />
                <BooleanDetailItem icon={Camera} label="Photographer Needed" value={tour.need_photographer} />
                <BooleanDetailItem icon={Star} label="VIP Services" value={tour.need_vip} />
              </CardContent>
            </Card>
         </div>
         
         <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <DetailItem icon={UserCheck} label="Full Name" value={tour.name} />
                <DetailItem icon={Mail} label="Email" value={tour.email} />
                <DetailItem icon={Phone} label="Mobile Number" value={tour.mobile_number} />
                <DetailItem icon={Phone} label="WhatsApp" value={tour.whatsapp_number} />
                <DetailItem icon={Clock} label="Best time to call" value={tour.time_to_call} />
              </CardContent>
            </Card>
            
             <Card>
              <CardHeader><CardTitle>Budget & Payment</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <DetailItem icon={Wallet} label="Budget" value={tour.budget ? formatCurrency(tour.budget as number) : 'N/A'} />
                <DetailItem icon={BookText} label="Payment Preference" value={tour.payment_preference} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Interests & Notes</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                  {renderTextList(tour.interested_locations, 'Interested Locations')}
                  {renderTextList(tour.interested_activities, 'Interested Activities')}
                  <Separator/>
                  {renderTextList(tour.things_to_include, 'Things to Include')}
                  <Separator/>
                  {renderTextList(tour.things_to_exclude, 'Things to Exclude')}
                  {tour.additional_notes && (
                       <div className="space-y-2">
                          <h3 className="font-semibold">Additional Notes</h3>
                          <p className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">{tour.additional_notes}</p>
                       </div>
                  )}
              </CardContent>
            </Card>
         </div>
      </div>
    </div>
  );
};


export default function CharterToursPage() {
  const [tours, setTours] = React.useState<CharterTour[]>([]);
  const [selectedTour, setSelectedTour] = React.useState<CharterTour | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    const fetchTours = async () => {
      setLoading(true);
      try {
        const data = await getCharterTours();
        setTours(data);
        if (data.length > 0 && !isMobile) {
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
  }, [toast, isMobile]);
  
  const handleSelectTour = (tour: CharterTour) => {
    setSelectedTour(tour);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col">
      {isMobile ? (
        <>
          <div className="absolute top-4 left-4 z-10 md:hidden">
              <Button size="icon" variant="outline" onClick={() => setIsSidebarOpen(true)}>
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open inquiries list</span>
              </Button>
          </div>
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetContent side="left" className="p-0 flex flex-col">
                  <div className="flex h-14 shrink-0 items-center border-b px-4 lg:h-[60px] lg:px-6">
                      <h2 className="text-lg font-semibold">Charter Inquiries</h2>
                  </div>
                  <ScrollArea className="flex-1">
                      <InquiryList
                          tours={tours}
                          selectedTour={selectedTour}
                          onSelect={handleSelectTour}
                          loading={loading}
                      />
                  </ScrollArea>
              </SheetContent>
          </Sheet>
          <ScrollArea className="h-full">
              <CharterTourDetail tour={selectedTour} />
          </ScrollArea>
        </>
      ) : (
        <div className="flex h-full w-full border-t">
          {/* Left panel (Desktop) */}
          <div className="flex h-full w-[320px] flex-col border-r bg-muted/40">
            <div className="flex h-14 shrink-0 items-center border-b px-4 lg:h-[60px] lg:px-6">
              <h2 className="text-lg font-semibold">Charter Inquiries</h2>
            </div>
            <ScrollArea className="flex-1">
              <InquiryList
                tours={tours}
                selectedTour={selectedTour}
                onSelect={handleSelectTour}
                loading={loading}
              />
            </ScrollArea>
          </div>

          {/* Right panel (Desktop) */}
          <ScrollArea className="h-full flex-1">
            <CharterTourDetail tour={selectedTour} />
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
