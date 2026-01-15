
"use client"

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { useIsMobile } from "@/hooks/use-mobile";

export function BookingCancellationChart({ data }: { data: any[] }) {
  const isMobile = useIsMobile();
  const barCategoryGap = isMobile ? '20%' : '30%';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking & Cancellation</CardTitle>
        <CardDescription>Monthly comparison of bookings vs. cancellations.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            bookings: {
              label: "Bookings",
              color: "hsl(142.1 76.2% 36.3%)", // Bright Light Green
            },
            cancellations: {
              label: "Cancellations",
              color: "hsl(24.6 95.0% 53.1%)", // Orange
            },
          }}
          className="h-[300px] w-full"
        >
          <BarChart data={data} barGap={10} barCategoryGap={barCategoryGap}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} interval={0} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    const currency = new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                      maximumFractionDigits: 0,
                    }).format(Number(value))
                    return (
                      <div className="flex flex-col">
                        <span className="capitalize">{name}</span>
                        <span className="font-bold">{currency}</span>
                      </div>
                    )
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="cancellations" fill="var(--color-cancellations)" name="Cancellations" radius={[4, 4, 0, 0]} />
            <Bar dataKey="bookings" fill="var(--color-bookings)" name="Bookings" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
