
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export function BookingCancellationChart({ data }: { data: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking & Cancellation Trends</CardTitle>
        <CardDescription>Monthly comparison of bookings vs. cancellations.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
                contentStyle={{
                    background: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                }}
            />
            <Legend />
            <Bar dataKey="bookings" fill="hsl(var(--primary))" name="Bookings" />
            <Bar dataKey="cancellations" fill="hsl(var(--destructive))" name="Cancellations" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
