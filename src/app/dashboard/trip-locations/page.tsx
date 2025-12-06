import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TripLocationsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trip Locations</CardTitle>
        <CardDescription>Manage your trip locations here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Content for trip locations will be displayed here.</p>
      </CardContent>
    </Card>
  );
}
