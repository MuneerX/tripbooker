

"use server"

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import type { TourPackage, TripDay, Activity, TripLocation, PayInPart, Booking, Review, BookingGuest, Payment, Profile, Operator } from '@/lib/types'
import { createClient } from '@supabase/supabase-js'

// Correctly create a Supabase client with admin privileges (service_role)
// This client does not use user cookies and has full access.
const createAdminClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
};


/**
 * Fetches all tour packages from Supabase using admin client to bypass RLS.
 */
export async function getTourPackages(): Promise<TourPackage[]> {
  const supabase = createAdminClient();
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
 * Fetches a single tour package by its ID from Supabase, along with its related data.
 */
export async function getTourPackageById(id: string): Promise<TourPackage | null> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('tour_packages')
      .select(`
        *,
        pay_in_parts(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching tour package ${id}:`, error)
      return null
    }

    if (!data) return null;
    
    return { ...data } as TourPackage;
}

/**
 * Creates a new tour package in Supabase using admin privileges.
 */
export async function createTourPackage(pkg: Partial<TourPackage>) {
  const supabase = createAdminClient();
  const { pay_in_parts, ...tourPackageData } = pkg;

  const insertData = {
    ...tourPackageData,
    name: pkg.name,
    package_type: pkg.package_type,
    category: pkg.category,
    base_price: pkg.base_price,
    days: pkg.days,
    nights: pkg.nights,
    max_guests: pkg.max_guests,
    description: pkg.description,
    highlights: pkg.highlights,
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


  const { data: newPackage, error } = await supabase.from('tour_packages').insert([insertData]).select().single();

  if (error) {
    console.error('Error creating tour package:', error);
    throw new Error(error.message);
  }

  if (pay_in_parts && pay_in_parts.length > 0) {
    const partsToInsert = pay_in_parts.map(part => ({ ...part, package_id: newPackage.id }));
    const { error: partsError } = await supabase.from('pay_in_parts').insert(partsToInsert);
    if (partsError) {
      console.error('Error creating pay_in_parts:', partsError);
      // Rollback package creation
      await supabase.from('tour_packages').delete().eq('id', newPackage.id);
      throw new Error(partsError.message);
    }
  }


  return newPackage;
}

/**
 * Uploads tour images to Supabase Storage and creates a new tour package using admin privileges.
 */
export async function uploadTourImages(formData: FormData) {
  const supabase = createAdminClient();

  const imageFiles = formData.getAll('image_files') as File[];
  const featuredImageFile = formData.get('featured_image_file') as File | null;
  const payInPartsRaw = formData.get('pay_in_parts');
  const payInParts = payInPartsRaw ? JSON.parse(payInPartsRaw as string) : [];


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
    highlights: formData.get('highlights') as string,
    inclusion: formData.get('inclusion') as string,
    exclusion: formData.get('exclusion') as string,
    booking_policy: formData.get('booking_policy') as string,
    cancellation_policy: formData.get('cancellation_policy') as string,
    terms_and_conditions: formData.get('terms_and_conditions') as string,
    is_featured: formData.get('is_featured') === 'true',
    is_active: formData.get('is_active') === 'true',
    image_urls: imageUrls,
    featured_image_url: featuredImageUrl,
    pay_in_parts: payInParts,
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
      highlights: formData.get('highlights') as string,
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

    // Delete existing parts
    const { error: deletePartsError } = await supabase.from('pay_in_parts').delete().eq('package_id', id);
    if (deletePartsError) {
      console.error('Error deleting pay_in_parts:', deletePartsError);
      throw new Error(deletePartsError.message);
    }
    
    const payInPartsRaw = formData.get('pay_in_parts');
    const payInParts = payInPartsRaw ? JSON.parse(payInPartsRaw as string) : [];
    // Insert new parts
    if (payInParts.length > 0) {
      const partsToInsert = payInParts.map((part: PayInPart) => {
        const { id: partId, ...rest } = part;
        return { ...rest, package_id: id };
      });
      const { error: partsError } = await supabase.from('pay_in_parts').insert(partsToInsert);
      if (partsError) {
        console.error('Error updating pay_in_parts:', partsError);
        throw new Error(partsError.message);
      }
    }


    return data;
}

/**
 * Deletes a tour package and all associated images from storage.
 */
export async function deleteTourPackage(pkg: TourPackage) {
  if (!pkg) throw new Error("Tour package data is required.");

  const supabase = createAdminClient();

  // 1. Collect all image URLs to delete
  const urlsToDelete = [...(pkg.image_urls || [])];
  if (pkg.featured_image_url) {
    urlsToDelete.push(pkg.featured_image_url);
  }

  const pathsToDelete: string[] = [];
  for (const url of urlsToDelete) {
    if (!url) continue;
    try {
        const urlObject = new URL(url);
        // Assuming the path is like /storage/v1/object/public/images/images/1720...
        const pathSegments = urlObject.pathname.split('/');
        const imagesIndex = pathSegments.indexOf('images');
        if (imagesIndex !== -1 && imagesIndex < pathSegments.length - 1) {
            const storagePath = pathSegments.slice(imagesIndex + 1).join('/');
            pathsToDelete.push(storagePath);
        }
    } catch (e) {
        console.warn(`Invalid URL found, skipping deletion: ${url}`);
    }
  }

  // 2. Delete images from storage if any paths were found
  if (pathsToDelete.length > 0) {
    const { error: storageError } = await supabase.storage.from('images').remove(pathsToDelete);
    if (storageError) {
      console.error("Error deleting images from storage:", storageError);
      // Decide if you want to stop the process or just log the error
      // For this case, we'll log and continue to delete the DB record
    }
  }

  // 3. Delete the tour package record from the database
  const { error: dbError } = await supabase.from('tour_packages').delete().eq('id', pkg.id);

  if (dbError) {
    console.error("Error deleting tour package from database:", dbError);
    throw new Error(dbError.message);
  }

  return { success: true };
}


/**
 * Updates only the status of a tour package.
 */
export async function updateTourPackageStatus(id: string, is_active: boolean) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('tour_packages')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating tour package status:', error);
        throw new Error(error.message);
    }

    return data;
}


// --- Trip Day Functions ---

/**
 * Fetches all trip days and their related tour package name and activity count.
 */
export async function getTripDays(): Promise<any[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('trip_days')
        .select(`
            id,
            day_number,
            day_name,
            title,
            tour_package:package_id(name), 
            activities:trip_day_activities(additional_cost)
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
    const supabase = createAdminClient();
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
    const supabase = createAdminClient();
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
        .select('*, place:place_id(*)')
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
export async function createTripDay(tripDayData: Partial<Omit<TripDay, 'id'>>) {
    const supabase = createAdminClient();
    const { activities, ...dayData } = tripDayData;

    const dayPayload = {
      ...dayData,
      title: dayData.title || null,
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
export async function updateTripDay(id: string, tripDayData: Partial<Omit<TripDay, 'id'>>) {
    const supabase = createAdminClient();
    const { activities, ...dayData } = tripDayData;

    // 1. Update the trip_day details
    const dayPayload = {
      ...dayData,
      title: dayData.title || null,
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
  const supabase = createAdminClient();
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
  const supabase = createAdminClient();
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
 * Deletes a trip location and its associated images from storage.
 */
export async function deleteTripLocation(location: TripLocation) {
    if (!location) throw new Error("Trip location data is required.");

    const supabase = createAdminClient();

    // 1. Collect all image URLs to delete
    const urlsToDelete = [...(location.image_urls || [])];
    const pathsToDelete: string[] = [];

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
    
    for (const url of urlsToDelete) {
        const path = getPathFromUrl(url);
        if (path) pathsToDelete.push(path);
    }

    // 2. Delete images from storage if any paths were found
    if (pathsToDelete.length > 0) {
        const { error: storageError } = await supabase.storage.from('images').remove(pathsToDelete);
        if (storageError) {
            console.error("Error deleting images from storage:", storageError);
            // We'll log and continue to delete the DB record
        }
    }

    // 3. Delete the trip location record from the database
    const { error: dbError } = await supabase.from('places').delete().eq('id', location.id);

    if (dbError) {
        console.error(`Error deleting trip location ${location.id}:`, dbError);
        throw new Error(dbError.message);
    }
    return { success: true };
}


// --- Booking and Review Functions ---

/**
 * Fetches all bookings from Supabase, or bookings for a specific package.
 */
export async function getBookings(packageId?: string): Promise<Booking[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from('tour_bookings')
    .select(`
      *,
      tour_package:package_id (name),
      customer:user_id (full_name, email, avatar_url)
    `)
    .order('created_at', { ascending: false });

  if (packageId) {
    query = query.eq('package_id', packageId);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching bookings:', error);
    throw new Error(error.message);
  }
  
  const bookings = (data || []).map((item: any) => ({
    ...item,
    customer_name: item.customer?.full_name || 'N/A',
    customer_email: item.customer?.email || 'N/A',
    avatar_url: item.customer?.avatar_url,
    status: item.booking_status
  }));

  return bookings as Booking[];
}


/**
 * Fetches all details for a single booking by its ID.
 */
export async function getBookingById(id: string): Promise<Booking | null> {
    const supabase = createAdminClient();

    // Fetch the main booking data and the customer profile in one go
    const { data: bookingData, error } = await supabase
        .from('tour_bookings')
        .select(`*, customer:user_id(*)`)
        .eq('id', id)
        .single();
    
    if (error) {
        console.error(`Error fetching booking ${id}:`, error);
        throw new Error(error.message);
    }

    if (!bookingData) return null;

    // Fetch related data in separate queries
    const { data: tourPackage, error: pkgError } = await supabase
        .from('tour_packages')
        .select(`*, pay_in_parts(*), trip_days:trip_days(*, activities:trip_day_activities(*, place:place_id(*)))`)
        .eq('id', bookingData.package_id)
        .single();

    if (pkgError) {
        console.error(`Error fetching tour package for booking ${id}:`, pkgError);
    }

    const { data: guests, error: guestsError } = await supabase
        .from('booking_guests')
        .select('*')
        .eq('booking_id', id);

    if (guestsError) {
        console.error(`Error fetching guests for booking ${id}:`, guestsError);
    }
    
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', bookingData.payments_id);

    if (paymentsError) {
      console.error(`Error fetching payments for booking ${id}:`, paymentsError);
    }


    const result: Booking = {
      ...bookingData,
      customer: bookingData.customer,
      tour_package: tourPackage || null,
      guests: guests || [],
      payments: payments || [],
    } as Booking;

    return result;
}


/**
 * Fetches all reviews from Supabase, or reviews for a specific package.
 */
export async function getReviews(packageId?: string): Promise<Review[]> {
  const supabase = createAdminClient();
   let query = supabase
    .from('reviews')
    .select(`
      *,
      customer:profiles (
        full_name,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false });

  if (packageId) {
    query = query.eq('package_id', packageId);
  }
  
  const { data, error } = await query;

  if (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }

  return (data || []).map((item: any) => ({
    ...item,
    comment: item.comment,
    customer_name: item.customer?.full_name || 'Anonymous',
    avatar_url: item.customer?.avatar_url,
  }));
}

export async function getProfiles(): Promise<Profile[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching profiles:', error);
        throw new Error(error.message);
    }
    
    return (data || []).map(profile => ({
      ...profile,
      status: profile.is_kv_customer ? 'active' : 'blocked'
    })) as Profile[];
}


export async function getProfileById(id: string): Promise<Profile | null> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
        
    if (error) {
        console.error(`Error fetching profile ${id}:`, error);
        return null;
    }
    
    if (!data) return null;

    return {
      ...data,
      status: data.is_kv_customer ? 'active' : 'blocked'
    } as Profile;
}


export async function updateProfileStatus(id: string, newStatus: 'active' | 'blocked') {
    const supabase = createAdminClient();
    const is_kv_customer = newStatus === 'active';
    const { data, error } = await supabase
        .from('profiles')
        .update({ is_kv_customer, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error(`Error updating profile status for ${id}:`, error);
        throw new Error(error.message);
    }
    
    return {
      ...data,
      status: data.is_kv_customer ? 'active' : 'blocked'
    } as Profile;
}


export async function updateProfile(id: string, profileData: Partial<Profile>) {
    const supabase = createAdminClient();
    const { status, ...updateData } = profileData;
    
    const { data, error } = await supabase
        .from('profiles')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error(`Error updating profile ${id}:`, error);
        throw new Error(error.message);
    }
    
    return {
      ...data,
      status: data.is_kv_customer ? 'active' : 'blocked'
    } as Profile;
}


// --- Operator Functions ---

export async function getOperators(): Promise<Operator[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('operators').select('*').order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching operators:', error);
    throw new Error(error.message);
  }

  return (data || []).map(op => ({
    ...op,
    status: op.is_active ? 'active' : 'blocked',
  })) as Operator[];
}

export async function deleteOperator(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('operators').delete().eq('id', id);
  if (error) {
    console.error('Error deleting operator:', error);
    throw new Error(error.message);
  }
  return { success: true };
}

export async function updateOperatorStatus(id: string, newStatus: 'active' | 'blocked'): Promise<Operator> {
  const supabase = createAdminClient();
  const is_active = newStatus === 'active';
  const { data, error } = await supabase
    .from('operators')
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating operator status for ${id}:`, error);
    throw new Error(error.message);
  }

  return {
    ...data,
    status: data.is_active ? 'active' : 'blocked',
  } as Operator;
}
