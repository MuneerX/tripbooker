
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { LatLngExpression, Icon } from 'leaflet';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { useDebounce } from '@/hooks/use-debounce';
import type { TripLocation } from '@/lib/types';
import { MapPin } from 'lucide-react';


const LOCATIONIQ_API_KEY = "pk.a8d62ce33fb7db732bdcd81162108c18";

const customIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
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

function MapUpdater({ 
    position, 
    onLocationChange 
}: { 
    position: [number, number]; 
    onLocationChange: (lat: number, lon: number) => void;
}) {
    const map = useMap();

    useEffect(() => {
        map.setView(position, map.getZoom());
    }, [position, map]);

    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            onLocationChange(lat, lng);
        },
    });
    
    const markerHandlers = useMemo(() => ({
        dragend(e: any) {
            const marker = e.target;
            const { lat, lng } = marker.getLatLng();
            onLocationChange(lat, lng);
        },
    }), [onLocationChange]);

    return (
        <>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position} icon={customIcon} draggable={true} eventHandlers={markerHandlers} />
        </>
    );
}

type LocationPickerProps = {
  initialPosition?: [number, number];
};

export function LocationPicker({ initialPosition }: LocationPickerProps) {
  const { setValue, watch, trigger, getValues } = useFormContext<TripLocation>();
  
  const [position, setPosition] = useState<[number, number]>(initialPosition || [20.5937, 78.9629]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationIQResult[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  const debouncedSearch = useDebounce(searchQuery, 500);

  const addressValue = watch('address');

  // Set initial address value in search bar
  useEffect(() => {
    if (initialPosition && addressValue) {
        setSearchQuery(addressValue);
    }
  }, [initialPosition, addressValue]);


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

    // This will trigger the useEffect in MapUpdater
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

        <div className="h-80 w-full rounded-md overflow-hidden border">
             <MapContainer center={position} zoom={13} scrollWheelZoom={true} className="h-full w-full">
                <MapUpdater position={position} onLocationChange={handleLocationChange} />
             </MapContainer>
        </div>
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
