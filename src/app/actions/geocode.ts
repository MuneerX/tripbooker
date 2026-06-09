"use server";

const LOCATIONIQ_API_KEY = process.env.LOCATIONIQ_API_KEY || "pk.a8d62ce33fb7db732bdcd81162108c18";

export async function searchGeocode(query: string) {
  if (!query || query.trim().length <= 2) {
    return [];
  }

  let success = false;
  let data: any[] = [];

  // 1. Try LocationIQ
  try {
    const url = `https://api.locationiq.com/v1/autocomplete.php?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(query)}&format=json&addressdetails=1`;
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (response.ok) {
      data = await response.json();
      success = true;
    } else {
      console.warn(`LocationIQ autocomplete API returned status: ${response.status}`);
    }
  } catch (error) {
    console.warn("LocationIQ autocomplete failed:", error);
  }

  // 2. Try Nominatim fallback
  if (!success) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": "yestogo-admin-panel",
        },
        next: { revalidate: 3600 }
      });
      if (response.ok) {
        const nominatimData = await response.json();
        data = nominatimData.map((item: any) => ({
          place_id: String(item.place_id),
          lat: item.lat,
          lon: item.lon,
          display_name: item.display_name,
          address: item.address || {},
          name: item.name || item.display_name.split(",")[0],
        }));
        success = true;
      } else {
        console.warn(`Nominatim search API returned status: ${response.status}`);
      }
    } catch (error) {
      console.error("Nominatim search failed:", error);
    }
  }

  return data;
}

export async function reverseGeocode(lat: number, lon: number) {
  let success = false;
  let data: any = null;

  // 1. Try LocationIQ
  try {
    const url = `https://us1.locationiq.com/v1/reverse.php?key=${LOCATIONIQ_API_KEY}&lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (response.ok) {
      data = await response.json();
      success = true;
    } else {
      console.warn(`LocationIQ reverse API returned status: ${response.status}`);
    }
  } catch (error) {
    console.warn("LocationIQ reverse geocoding failed:", error);
  }

  // 2. Try Nominatim fallback
  if (!success) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": "yestogo-admin-panel",
        },
        next: { revalidate: 3600 }
      });
      if (response.ok) {
        data = await response.json();
        success = true;
      } else {
        console.warn(`Nominatim reverse API returned status: ${response.status}`);
      }
    } catch (error) {
      console.error("Nominatim reverse geocoding failed:", error);
    }
  }

  return { success, data };
}
