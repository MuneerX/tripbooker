

"use server"

import { createServerClient } from '@supabase/ssr'
import { createClient as createBrowserClient } from './client'
import { cookies } from 'next/headers'

import type { TourPackage, TripDay, Activity, TripLocation } from '@/lib/types'

/**
 * Fetches all tour packages from Supabase.
 */
export async function getTourPackages(): Promise<TourPackage[]> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.from('tour_packages').select('*').order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching tour packages:', error)
    return []
  }
  
  return (data || []).map(pkg => ({
    ...pkg,
  })) as TourPackage[];
}

/**
 * Fetches a single tour package by its ID from Supabase.
 */
export async function getTourPackageById(id: string): Promise<TourPackage | null> {
    const supabase = createBrowserClient();
    const { data, error } = await supabase.from('tour_packages').select('*').eq('id', id).single()

    if (error) {
      console.error(`Error fetching tour package ${id}:`, error)
      return null
    }

    if (!data) return null;

    return { ...data } as TourPackage;
}

// Function to create a Supabase client with admin privileges (service_role)
function createAdminClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // The `set` method was called from a Server Component.
            }
          },
          remove(name: string, options) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // The `delete` method was called from a Server Component.
            }
          },
      },
    }
  );
}

/**
 * Creates a new tour package in Supabase using admin privileges.
 */
export async function createTourPackage(pkg: Partial<TourPackage>) {
  const supabase = createAdminClient();
  // Ensure we are not sending undefined fields that might cause issues.
  const insertData = {
    name: pkg.name,
    package_type: pkg.package_type,
    category: pkg.category,
    base_price: pkg.base_price,
    days: pkg.days,
    nights: pkg.nights,
    max_guests: pkg.max_guests,
    description: pkg.description,
    inclusion: pkg.inclusion,
    exclusion: pkg.exclusion,
    booking_policy: pkg.booking_policy,
    cancellation_policy: pkg.cancellation_policy,
    terms_and_conditions: pkg.terms_and_conditions,
    is_featured: pkg.is_featured,
    is_active: pkg.is_active,
    image_urls: pkg.image_urls,
    featured_image_url: pkg.featured_image_url,
  };


  const { data, error } = await supabase.from('tour_packages').insert([insertData]).select().single();

  if (error) {
    console.error('Error creating tour package:', error);
    throw new Error(error.message);
  }

  return data;
}

/**
 * Uploads tour images to Supabase Storage and creates a new tour package using admin privileges.
 */
export async function uploadTourImages(formData: FormData) {
  const supabase = createAdminClient();

  const imageFiles = formData.getAll('image_files') as File[];
  const featuredImageFile = formData.get('featured_image_file') as File | null;

  const imageUrls: string[] = [];
  let featuredImageUrl: string | undefined = undefined;

  // Upload gallery images
  if (imageFiles && imageFiles.length > 0) {
    for (const file of imageFiles) {
        if (file && file.size > 0) {
            const filePath = `images/${Date.now()}-${file.name}`;
            const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);

            if (uploadError) {
                console.error('Error uploading image:', uploadError);
                throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
            }

            const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
            imageUrls.push(publicUrl);
        }
    }
  }

  // Upload featured image if it exists
  if (featuredImageFile && featuredImageFile.size > 0) {
    const filePath = `images/featured/${Date.now()}-${featuredImageFile.name}`;
    const { error: uploadError } = await supabase.storage.from('images').upload(filePath, featuredImageFile);

    if (uploadError) {
      console.error('Error uploading featured image:', uploadError);
      throw new Error(`Failed to upload featured image: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
    featuredImageUrl = publicUrl;
  }
  
  const tourPackageData: Partial<TourPackage> = {
    name: formData.get('name') as string,
    package_type: formData.get('package_type') as TourPackage['package_type'],
    category: formData.get('category') as TourPackage['category'],
    base_price: Number(formData.get('base_price')),
    days: Number(formData.get('days')),
    nights: Number(formData.get('nights')),
    max_guests: Number(formData.get('max_guests')),
    description: formData.get('description') as string,
    inclusion: formData.get('inclusion') as string,
    exclusion: formData.get('exclusion') as string,
    booking_policy: formData.get('booking_policy') as string,
    cancellation_policy: formData.get('cancellation_policy') as string,
    terms_and_conditions: formData.get('terms_and_conditions') as string,
    is_featured: formData.get('is_featured') === 'true',
    is_active: formData.get('is_active') === 'true',
    image_urls: imageUrls,
    featured_image_url: featuredImageUrl,
  };
  
  return createTourPackage(tourPackageData);
}


/**
 * Updates an existing tour package and handles image deletions/uploads.
 */
export async function updateTourPackage(id: string, formData: FormData) {
    const supabase = createAdminClient();

    const getPathFromUrl = (url: string): string | null => {
        if (!url) return null;
        try {
            const urlObject = new URL(url);
            const pathSegments = urlObject.pathname.split('/');
            const bucketNameIndex = pathSegments.findIndex(segment => segment === 'images');

            if (bucketNameIndex === -1 || bucketNameIndex + 1 >= pathSegments.length) {
                console.warn('Could not determine storage path from URL:', url);
                return null;
            }
            
            const filePath = pathSegments.slice(bucketNameIndex + 1).join('/');
            return decodeURIComponent(filePath);
        } catch (e) {
            console.error('Invalid URL for image deletion:', url, e);
            return null;
        }
    };

    const isFeatured = formData.get('is_featured') === 'true';
    const originalImageUrls: string[] = JSON.parse(formData.get('original_image_urls') as string || '[]');
    const keptImageUrls: string[] = JSON.parse(formData.get('image_urls') as string || '[]');
    const originalFeaturedUrl = formData.get('original_featured_image_url') as string || null;
    
    const newGalleryFiles = formData.getAll('new_image_files').filter(f => f instanceof File && f.size > 0) as File[];
    const newFeaturedFile = formData.get('new_featured_image_file') instanceof File && (formData.get('new_featured_image_file') as File).size > 0 
      ? formData.get('new_featured_image_file') as File 
      : null;
    
    const pathsToDelete: string[] = [];

    // Find gallery images that were removed.
    originalImageUrls.forEach(originalUrl => {
        if (!keptImageUrls.includes(originalUrl)) {
            const path = getPathFromUrl(originalUrl);
            if (path) pathsToDelete.push(path);
        }
    });

    // Determine if the original featured image should be deleted.
    const featuredUrlOnForm = formData.get('featured_image_url') as string;
    if (originalFeaturedUrl) {
      const isReplaced = !!newFeaturedFile;
      const isDeselected = !isFeatured;
      const wasManuallyRemoved = !featuredUrlOnForm;

      if (isReplaced || isDeselected || wasManuallyRemoved) {
          const path = getPathFromUrl(originalFeaturedUrl);
          if (path) pathsToDelete.push(path);
      }
    }

    if (pathsToDelete.length > 0) {
        console.log('Deleting paths from storage:', pathsToDelete);
        const { error: deleteError } = await supabase.storage.from('images').remove(pathsToDelete);
        if (deleteError) {
            console.error("Failed to delete some images from storage:", deleteError.message);
        }
    }

    const uploadedImageUrls: string[] = [];
    let uploadedFeaturedImageUrl: string | undefined = undefined;

    if (newGalleryFiles.length > 0) {
      for (const file of newGalleryFiles) {
        const filePath = `images/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
        if (uploadError) throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
        uploadedImageUrls.push(publicUrl);
      }
    }

    if (newFeaturedFile) {
      const filePath = `images/featured/${Date.now()}-${newFeaturedFile.name}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(filePath, newFeaturedFile);
      if (uploadError) throw new Error(`Failed to upload featured image: ${uploadError.message}`);
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
      uploadedFeaturedImageUrl = publicUrl;
    }

    const finalImageUrls = [...keptImageUrls, ...uploadedImageUrls];
    let finalFeaturedImageUrl: string | null | undefined = uploadedFeaturedImageUrl;
    if (finalFeaturedImageUrl === undefined) {
        finalFeaturedImageUrl = formData.get('featured_image_url') as string | null;
    }
    
    if (!isFeatured) {
        finalFeaturedImageUrl = null;
    }

    const updateData = {
      name: formData.get('name') as string,
      package_type: formData.get('package_type') as TourPackage['package_type'],
      category: formData.get('category') as TourPackage['category'],
      base_price: Number(formData.get('base_price')),
      days: Number(formData.get('days')),
      nights: Number(formData.get('nights')),
      max_guests: Number(formData.get('max_guests')),
      description: formData.get('description') as string,
      inclusion: formData.get('inclusion') as string,
      exclusion: formData.get('exclusion') as string,
      booking_policy: formData.get('booking_policy') as string,
      cancellation_policy: formData.get('cancellation_policy') as string,
      terms_and_conditions: formData.get('terms_and_conditions') as string,
      is_featured: isFeatured,
      is_active: formData.get('is_active') === 'true',
      image_urls: finalImageUrls,
      featured_image_url: finalFeaturedImageUrl,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('tour_packages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating tour package:', error);
      throw new Error(error.message);
    }

    return data;
}

// --- Trip Day Functions ---

/**
 * Fetches all trip days and their related tour package name and activity count.
 */
export async function getTripDays(): Promise<any[]> {
    const supabase = createBrowserClient();
    const { data, error } = await supabase
        .from('trip_days')
        .select(`
            id,
            day_number,
            day_name,
            title,
            tour_package:package_id(name), 
            trip_day_activities(count)
        `)
        .order('day_number', { ascending: true });

    if (error) {
        console.error('Error fetching trip days:', error);
        return [];
    }
    
    return data || [];
}


/**
 * Fetches trip days for a specific tour package ID.
 */
export async function getTripDaysForPackage(packageId: string): Promise<TripDay[]> {
    const supabase = createBrowserClient();
    const { data, error } = await supabase
        .from('trip_days')
        .select(`*, activities:trip_day_activities(*)`)
        .eq('package_id', packageId)
        .order('day_number', { ascending: true });

    if (error) {
        console.error(`Error fetching trip days for package ${packageId}:`, error);
        return [];
    }

    return (data || []) as TripDay[];
}


/**
 * Fetches a single trip day by its ID.
 */
export async function getTripDayById(id: string): Promise<TripDay | null> {
    const supabase = createBrowserClient();
    const { data, error } = await supabase
        .from('trip_days')
        .select(`*, tour_package:package_id(name)`)
        .eq('id', id)
        .single();
    
    if (error) {
        console.error(`Error fetching trip day ${id}:`, error);
        return null;
    }
    
    const { data: activities, error: activitiesError } = await supabase
        .from('trip_day_activities')
        .select('*')
        .eq('trip_day_id', id)
        .order('activity_time');
        
    if (activitiesError) {
        console.error(`Error fetching activities for trip day ${id}:`, activitiesError);
    }

    return { ...data, activities: activities || [] } as TripDay;
}

/**
 * Creates a new trip day and its activities.
 */
export async function createTripDay(tripDayData: Partial<TripDay>) {
    const supabase = createAdminClient();
    const { activities, ...dayData } = tripDayData;

    const dayPayload = {
      ...dayData,
      title: dayData.title || null,
      accommodation_type: dayData.accommodation_type || null,
      accommodation_name: dayData.accommodation_name || null,
      meals_included: dayData.meals_included || [],
    };

    const { data: newDay, error: dayError } = await supabase
        .from('trip_days')
        .insert([dayPayload])
        .select()
        .single();

    if (dayError) {
        console.error('Error creating trip day:', dayError);
        throw new Error(dayError.message);
    }

    if (activities && activities.length > 0) {
        const activitiesToInsert = activities.map(act => {
            const { id, ...restOfAct } = act; // Exclude the temporary client-side ID
            return {
                ...restOfAct,
                trip_day_id: newDay.id,
            };
        });

        const { error: activitiesError } = await supabase
            .from('trip_day_activities')
            .insert(activitiesToInsert);

        if (activitiesError) {
            console.error('Error creating activities:', activitiesError);
            // Attempt to rollback the trip day creation if activities fail
            await supabase.from('trip_days').delete().eq('id', newDay.id);
            throw new Error(`Failed to create activities: ${activitiesError.message}`);
        }
    }

    return newDay;
}

/**
 * Updates a trip day and its activities using a "delete and replace" strategy.
 */
export async function updateTripDay(id: string, tripDayData: Partial<TripDay>) {
    const supabase = createAdminClient();
    const { activities, ...dayData } = tripDayData;

    // 1. Update the trip_day details
    const dayPayload = {
      ...dayData,
      title: dayData.title || null,
      accommodation_type: dayData.accommodation_type || null,
      accommodation_name: dayData.accommodation_name || null,
      meals_included: dayData.meals_included || [],
      updated_at: new Date().toISOString(),
    };
    const { data: updatedDay, error: dayError } = await supabase
        .from('trip_days')
        .update(dayPayload)
        .eq('id', id)
        .select()
        .single();

    if (dayError) {
        console.error('Error updating trip day:', dayError);
        throw new Error(dayError.message);
    }
    
    // 2. Delete all existing activities for this trip day
    const { error: deleteError } = await supabase
        .from('trip_day_activities')
        .delete()
        .eq('trip_day_id', id);

    if (deleteError) {
        console.error('Error deleting old activities:', deleteError);
        throw new Error(`Failed to delete old activities: ${deleteError.message}`);
    }

    // 3. Insert the new list of activities
    if (activities && activities.length > 0) {
        const activitiesToInsert = activities.map(act => {
            const { id: activityId, ...restOfAct } = act; // Exclude the old client-side ID
            return {
                ...restOfAct,
                trip_day_id: id,
            };
        });

        const { error: insertError } = await supabase
            .from('trip_day_activities')
            .insert(activitiesToInsert);

        if (insertError) {
            console.error('Error inserting new activities:', insertError);
            throw new Error(`Failed to save new activities: ${insertError.message}`);
        }
    }

    return updatedDay;
}


/**
 * Deletes a trip day. Activities will be cascade deleted by the database.
 */
export async function deleteTripDay(id: string) {
    const supabase = createAdminClient();
    const { error } = await supabase.from('trip_days').delete().eq('id', id);
    if (error) {
        console.error('Error deleting trip day:', error);
        throw new Error(error.message);
    }
    return { success: true };
}


// --- Trip Location Functions ---

/**
 * Fetches all trip locations from Supabase.
 */
export async function getTripLocations(): Promise<TripLocation[]> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.from('places').select('*').order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching trip locations:', error);
    return [];
  }
  return data as TripLocation[];
}

/**
 * Fetches a single trip location by its ID from Supabase.
 */
export async function getTripLocationById(id: string): Promise<TripLocation | null> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.from('places').select('*').eq('id', id).single();

  if (error) {
    console.error(`Error fetching trip location ${id}:`, error);
    return null;
  }
  if (!data) return null;

  return data as TripLocation;
}

/**
 * Creates a new trip location.
 */
export async function createTripLocation(locationData: Partial<Omit<TripLocation, 'id' | 'created_at' | 'updated_at'>>) {
    const supabase = createAdminClient();
    
    const { data, error } = await supabase.from('places').insert([locationData]).select().single();

    if (error) {
        console.error('Error creating trip location:', error);
        throw new Error(error.message);
    }
    return data;
}

/**
 * Uploads images and creates a new trip location record.
 */
export async function createTripLocationWithImages(formData: FormData) {
  const supabase = createAdminClient();

  const imageFiles = formData.getAll('image_files') as File[];
  const imageUrls: string[] = [];

  if (imageFiles && imageFiles.length > 0) {
    for (const file of imageFiles) {
      if (file && file.size > 0) {
        const filePath = `images/locations/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
        imageUrls.push(publicUrl);
      }
    }
  }

  const locationData = {
    name: formData.get('name') as string,
    place_type: formData.get('place_type') as string,
    city: formData.get('city') as string,
    country: formData.get('country') as string,
    latitude: Number(formData.get('latitude')) || null,
    longitude: Number(formData.get('longitude')) || null,
    state: formData.get('state') as string,
    district: formData.get('district') as string,
    code: formData.get('code') as string,
    description: formData.get('description') as string,
    address: formData.get('address') as string,
    is_active: formData.get('is_active') === 'true',
    image_urls: imageUrls,
  };

  return createTripLocation(locationData);
}


/**
 * Updates an existing trip location and handles image uploads/deletions.
 */
export async function updateTripLocation(id: string, formData: FormData) {
    const supabase = createAdminClient();

    const getPathFromUrl = (url: string): string | null => {
        if (!url) return null;
        try {
            const urlObject = new URL(url);
            const pathSegments = urlObject.pathname.split('/');
            const bucketNameIndex = pathSegments.findIndex(segment => segment === 'images');
            if (bucketNameIndex === -1 || bucketNameIndex + 1 >= pathSegments.length) {
                console.warn('Could not determine storage path from URL:', url);
                return null;
            }
            const filePath = pathSegments.slice(bucketNameIndex + 1).join('/');
            return decodeURIComponent(filePath);
        } catch (e) {
            console.error('Invalid URL for image deletion:', url, e);
            return null;
        }
    };

    const originalImageUrls: string[] = JSON.parse(formData.get('original_image_urls') as string || '[]');
    const keptImageUrls: string[] = JSON.parse(formData.get('image_urls') as string || '[]');
    const newImageFiles = formData.getAll('new_image_files').filter(f => f instanceof File && f.size > 0) as File[];
    
    const pathsToDelete: string[] = [];
    originalImageUrls.forEach(originalUrl => {
        if (!keptImageUrls.includes(originalUrl)) {
            const path = getPathFromUrl(originalUrl);
            if (path) pathsToDelete.push(path);
        }
    });

    if (pathsToDelete.length > 0) {
        const { error: deleteError } = await supabase.storage.from('images').remove(pathsToDelete);
        if (deleteError) {
            console.error("Failed to delete images from storage:", deleteError.message);
        }
    }

    const uploadedImageUrls: string[] = [];
    if (newImageFiles.length > 0) {
      for (const file of newImageFiles) {
        const filePath = `images/locations/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
        if (uploadError) throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
        uploadedImageUrls.push(publicUrl);
      }
    }

    const finalImageUrls = [...keptImageUrls, ...uploadedImageUrls];

    const updateData = {
        name: formData.get('name') as string,
        place_type: formData.get('place_type') as string,
        city: formData.get('city') as string,
        country: formData.get('country') as string,
        latitude: Number(formData.get('latitude')) || null,
        longitude: Number(formData.get('longitude')) || null,
        state: formData.get('state') as string,
        district: formData.get('district') as string,
        code: formData.get('code') as string,
        description: formData.get('description') as string,
        address: formData.get('address') as string,
        is_active: formData.get('is_active') === 'true',
        image_urls: finalImageUrls,
        updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('places').update(updateData).eq('id', id).select().single();

    if (error) {
        console.error(`Error updating trip location ${id}:`, error);
        throw new Error(error.message);
    }
    return data;
}


/**
 * Deletes a trip location.
 */
export async function deleteTripLocation(id: string) {
    const supabase = createAdminClient();
    const { error } = await supabase.from('places').delete().eq('id', id);

    if (error) {
        console.error(`Error deleting trip location ${id}:`, error);
        throw new Error(error.message);
    }
    return { success: true };
}
