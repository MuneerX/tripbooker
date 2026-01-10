
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"

export function BookingCancellationChart({ data }: { data: any[] }) {
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
              color: "hsl(var(--chart-2))",
            },
            cancellations: {
              label: "Cancellations",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="h-[300px] w-full"
        >
          <BarChart data={data} barGap={10} barCategoryGap="20%">
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
            <Bar dataKey="cancellations" fill="var(--color-cancellations)" name="Cancellation" radius={[4, 4, 0, 0]} />
            <Bar dataKey="bookings" fill="var(--color-bookings)" name="Bookings" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
