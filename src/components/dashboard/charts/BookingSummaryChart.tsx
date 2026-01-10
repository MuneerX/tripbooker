
"use client"

import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"

export function BookingSummaryChart({ data }: { data: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bookings Summary</CardTitle>
        <CardDescription>A monthly summary of your total bookings.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="h-[300px] w-full">
          <AreaChart data={data}>
            <defs>
                <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} interval={0} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
             <ChartTooltip
              cursor={{ stroke: '#3B82F6', strokeWidth: 1, strokeDasharray: '3 3' }}
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
            <Legend content={<ChartLegendContent />} />
            <Area type="monotone" dataKey="bookings" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorBookings)" name="Bookings"/>
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
