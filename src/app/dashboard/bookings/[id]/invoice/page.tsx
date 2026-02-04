
"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { getBookingById } from "@/lib/supabase/queries";
import type { Booking } from "@/lib/types";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { useTheme } from 'next-themes';
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

// Invoice component
const InvoiceDetail = ({ booking }: { booking: Booking }) => {
    const { theme } = useTheme();
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

    if (!booking || !booking.tour_package) return null;

    const logoUrl = theme === 'dark' 
    ? "https://i.ibb.co/7xpjJbKh/logoy2go-white.png" 
    : "https://i.ibb.co/VpQvKQ2X/logoy2go.png";

    const customer = booking.customer;
    const tourPackage = booking.tour_package;

    return (
        <div className="max-w-4xl mx-auto p-8 bg-background text-foreground rounded-lg shadow-lg my-12 print:shadow-none print:my-0">
            <header className="flex justify-between items-start mb-8">
                <div>
                     {mounted && <Image src={logoUrl} alt="Yes To Go Logo" width={120} height={32} />}
                     <p className="text-muted-foreground text-sm mt-2">
                        Invoice / Bill of Supply
                     </p>
                </div>
                <div className="text-right">
                    <h1 className="text-3xl font-bold text-primary">INVOICE</h1>
                    <p className="text-sm text-muted-foreground font-mono"># {booking.order_id}</p>
                </div>
            </header>

            <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <h3 className="font-semibold mb-2">Billed To:</h3>
                    <p className="font-bold">{customer.full_name}</p>
                    {customer.address && <p>{customer.address}</p>}
                    {(customer.city || customer.pincode) &&
                        <p>
                            {customer.city}
                            {customer.city && customer.pincode && ', '}
                            {customer.pincode}
                        </p>
                    }
                    {customer.email && <p>{customer.email}</p>}
                    {customer.phone_number && <p>{customer.phone_number}</p>}
                </div>
                <div className="text-right">
                    <p><span className="font-semibold">Invoice Date:</span> {format(new Date(), "PPP")}</p>
                    <p><span className="font-semibold">Booking Date:</span> {format(new Date(booking.booking_date), "PPP")}</p>
                    <p><span className="font-semibold">Travel Date:</span> {booking.travel_date ? format(new Date(booking.travel_date), "PPP") : 'N/A'}</p>
                </div>
            </div>
            
            <div className="print:break-inside-avoid">
                <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
                <div className="border rounded-lg">
                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <h3 className="font-semibold">{tourPackage.name}</h3>
                            <p className="text-sm text-muted-foreground capitalize">{tourPackage.package_type} / {tourPackage.category}</p>
                        </div>
                         <div>
                            <p className="text-sm text-muted-foreground">Duration</p>
                            <p className="font-medium">{tourPackage.days} Days / {tourPackage.nights} Nights</p>
                        </div>
                         <div>
                            <p className="text-sm text-muted-foreground">Guests</p>
                            <p className="font-medium">{booking.total_adults} Adult(s), {booking.total_children} Child(ren)</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 print:break-inside-avoid">
                <h2 className="text-xl font-semibold mb-4">Payment Summary</h2>
                 <div className="border rounded-lg">
                    <div className="p-4 space-y-2">
                        <div className="flex justify-between"><span>Package Amount</span><span>{formatCurrency(tourPackage.base_price)}</span></div>
                        <div className="flex justify-between"><span>Service Fee</span><span>{formatCurrency(0)}</span></div>
                        <div className="flex justify-between"><span>Taxes (GST)</span><span>{formatCurrency(0)}</span></div>
                        <div className="flex justify-between text-muted-foreground"><span >Discount</span><span>- {formatCurrency(0)}</span></div>
                        <Separator className="my-2"/>
                        <div className="flex justify-between font-bold text-lg"><span >Total Amount</span><span>{formatCurrency(booking.total_amount)}</span></div>
                         <Separator className="my-2"/>
                         <div className="flex justify-between font-bold text-green-600"><span >Amount Paid</span><span>{formatCurrency(booking.payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0)}</span></div>
                    </div>
                </div>
            </div>

            {booking.payments && booking.payments.length > 0 && (
                 <div className="mt-8 print:break-inside-avoid">
                    <h2 className="text-xl font-semibold mb-4">Payment Transactions</h2>
                    <div className="border rounded-lg">
                        {booking.payments.map((payment, index) => (
                            <React.Fragment key={payment.id}>
                                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Transaction ID</p>
                                        <p className="font-medium font-mono text-xs">{payment.transaction_id || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Date</p>
                                        <p className="font-medium">{format(new Date(payment.created_at), "PPP")}</p>
                                    </div>
                                     <div>
                                        <p className="text-sm text-muted-foreground">Method</p>
                                        <p className="font-medium capitalize">{payment.payment_method || 'N/A'}</p>
                                    </div>
                                     <div>
                                        <p className="text-sm text-muted-foreground">Amount</p>
                                        <p className="font-medium">{formatCurrency(payment.amount)}</p>
                                    </div>
                                </div>
                                {booking.payments && index < booking.payments.length - 1 && <Separator/>}
                           </React.Fragment>
                        ))}
                    </div>
                </div>
            )}


            <footer className="mt-12 text-center text-muted-foreground text-sm">
                <p>Thank you for booking with Yes To Go!</p>
                <p>This is a computer-generated invoice and does not require a signature.</p>
            </footer>
        </div>
    );
};


export default function BookingInvoicePage() {
    const params = useParams();
    const { id } = params as { id: string };
    const [booking, setBooking] = React.useState<Booking | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (id) {
            getBookingById(id).then(data => {
                setBooking(data);
                setLoading(false);
            });
        }
    }, [id]);

    if (loading) {
        return <div className="h-screen flex items-center justify-center">Loading invoice...</div>;
    }

    if (!booking) {
        return <div className="h-screen flex items-center justify-center">Booking not found.</div>;
    }

    return (
        <>
            <div className="absolute top-20 right-4 print:hidden">
                <Button onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print / Save as PDF
                </Button>
            </div>
            <InvoiceDetail booking={booking} />
        </>
    );
}
