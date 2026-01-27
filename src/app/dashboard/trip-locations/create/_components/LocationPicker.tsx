
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { useDebounce } from '@/hooks/use-debounce';
import type { TripLocation } from '@/lib/types';
import { MapPin } from 'lucide-react';


const LOCATIONIQ_API_KEY = "pk.a8d62ce33fb7db732bdcd81162108c18";

// Fix for default icon path in webpack environments
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


type LocationIQResult = {
  place_id: string;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state_district?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  name?: string;
};

type LocationPickerProps = {
  initialPosition: [number, number];
};

export function LocationPicker({ initialPosition }: LocationPickerProps) {
  const { setValue, watch, trigger, getValues } = useFormContext<TripLocation>();
  
  const [position, setPosition] = useState<[number, number]>(initialPosition);
  const [searchQuery, setSearchQuery] = useState(watch('address') || '');
  const [suggestions, setSuggestions] = useState<LocationIQResult[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  const debouncedSearch = useDebounce(searchQuery, 500);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView(position, 13);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const marker = L.marker(position, { draggable: true }).addTo(map);
      markerRef.current = marker;

      marker.on('dragend', () => {
        const { lat, lng } = marker.getLatLng();
        handleLocationChange(lat, lng);
      });

      map.on('click', (e) => {
        handleLocationChange(e.latlng.lat, e.latlng.lng);
      });
    }

    // Cleanup function to remove the map
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(position, 13);
    }
    if (markerRef.current) {
      markerRef.current.setLatLng(position);
    }
  }, [position]);

  useEffect(() => {
    if (debouncedSearch.length > 2) {
      const fetchSuggestions = async () => {
        try {
          const response = await fetch(
            `https://api.locationiq.com/v1/autocomplete.php?key=${LOCATIONIQ_API_KEY}&q=${debouncedSearch}&format=json&addressdetails=1`
          );
          if (response.ok) {
            const data: LocationIQResult[] = await response.json();
            setSuggestions(data);
            if(data.length > 0) setIsPopoverOpen(true);
          } else {
            setSuggestions([]);
          }
        } catch (error) {
          console.error("Error fetching location suggestions:", error);
          setSuggestions([]);
        }
      };
      fetchSuggestions();
    } else {
      setSuggestions([]);
      setIsPopoverOpen(false);
    }
  }, [debouncedSearch]);
  
  const updateFormFields = useCallback((lat: number, lon: number, location: Partial<LocationIQResult>) => {
    setValue('latitude', lat);
    setValue('longitude', lon);

    if (location.display_name) {
      setValue('address', location.display_name);
    }
    
    const locationName = location.name || getValues('name') || '';
    const cityName = location.address?.city;

    if (cityName) {
      setValue('city', cityName);
    }
    if (location.address?.state) {
      setValue('state', location.address.state);
    }
    if (location.address?.country) {
      setValue('country', location.address.country);
    }
    const district = location.address?.state_district || location.address?.county;
    if (district) {
      setValue('district', district);
    }

    if(cityName && locationName) {
        const cityCode = cityName.substring(0, 3).toUpperCase();
        const nameCode = locationName.substring(0, 3).toUpperCase();
        setValue('code', `${cityCode}-${nameCode}`);
    } else if (cityName) {
        setValue('code', `${cityName.substring(0, 3).toUpperCase()}-LOC`);
    }

    ['latitude', 'longitude', 'address', 'city', 'state', 'country', 'district', 'code'].forEach(field => trigger(field as keyof TripLocation));

  }, [setValue, trigger, getValues]);


  const handleLocationChange = useCallback(async (lat: number, lon: number) => {
    setPosition([lat, lon]);
    try {
        const response = await fetch(`https://us1.locationiq.com/v1/reverse.php?key=${LOCATIONIQ_API_KEY}&lat=${lat}&lon=${lon}&format=json&addressdetails=1`);
        if (response.ok) {
            const data: LocationIQResult = await response.json();
            updateFormFields(lat, lon, data);
            if (data.display_name) setSearchQuery(data.display_name);
        }
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        updateFormFields(lat, lon, {});
    }
  }, [updateFormFields]);
  

  const handleSuggestionClick = (suggestion: LocationIQResult) => {
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);
    
    if(!getValues('name')) {
        const name = suggestion.display_name.split(',')[0];
        setValue('name', name);
    }

    setPosition([lat, lon]);

    updateFormFields(lat, lon, suggestion);
    setSearchQuery(suggestion.display_name);
    setSuggestions([]);
    setIsPopoverOpen(false);
  };
  
  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setIsPopoverOpen(true);
    }
  };

  return (
    <div className="space-y-4">
        <div className="grid gap-2">
            <label className="text-sm font-medium">Search Address</label>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                    <div className="relative">
                        <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Start typing an address..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={handleInputFocus}
                            className="pl-8"
                        />
                    </div>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-[--radix-popover-trigger-width] p-0" 
                  align="start"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <Command>
                        <CommandList>
                            <CommandGroup>
                                {suggestions.map((item, index) => (
                                    <CommandItem
                                        key={`${item.place_id}-${index}`}
                                        onSelect={() => handleSuggestionClick(item)}
                                        value={item.display_name}
                                    >
                                        {item.display_name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>

        <div ref={mapRef} className="h-80 w-full rounded-md overflow-hidden border relative z-0"></div>
        <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
                <label className="text-sm font-medium">Latitude</label>
                <Input value={watch('latitude') || ''} readOnly />
             </div>
             <div className="grid gap-2">
                <label className="text-sm font-medium">Longitude</label>
                <Input value={watch('longitude') || ''} readOnly />
             </div>
        </div>
    </div>
  );
}
