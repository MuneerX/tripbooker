

"use server"

import { createServerClient } from '@supabase/ssr'
import { createClient as createBrowserClient } from './client'
import { cookies } from 'next/headers'

import type { TourPackage, TripDay, Activity } from '@/lib/types'

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
        // Correctly find the start of the path after the bucket name
        const pathSegment = '/storage/v1/object/public/images/';
        const pathname = urlObject.pathname;
        const pathStartIndex = pathname.indexOf(pathSegment);
        
        if (pathStartIndex === -1) {
            // Fallback for potentially different structures like featured images
            const alternativeSegment = '/images/featured/';
            const altIndex = pathname.indexOf(alternativeSegment);
            if (altIndex !== -1) {
                 return decodeURIComponent(pathname.substring(altIndex + 1));
            }
            console.warn('Could not determine storage path from URL:', url);
            return null;
        };

        const filePath = pathname.substring(pathStartIndex + pathSegment.length);
        return `images/${decodeURIComponent(filePath)}`;

    } catch (e) {
        console.error('Invalid URL for image deletion:', url, e);
        return null;
    }
  };


  // --- 1. GATHER DATA FROM FORM ---
  const isFeatured = formData.get('is_featured') === 'true';
  const originalImageUrls: string[] = JSON.parse(formData.get('original_image_urls') as string || '[]');
  const keptImageUrls: string[] = JSON.parse(formData.get('image_urls') as string || '[]');
  const originalFeaturedUrl = formData.get('original_featured_image_url') as string || null;
  
  const newGalleryFiles = formData.getAll('new_image_files').filter(f => f instanceof File && f.size > 0) as File[];
  const newFeaturedFile = formData.get('new_featured_image_file') instanceof File && (formData.get('new_featured_image_file') as File).size > 0 
    ? formData.get('new_featured_image_file') as File 
    : null;
  
  // --- 2. HANDLE IMAGE DELETIONS ---
  const pathsToDelete: string[] = [];

  // Find gallery images that were removed.
  originalImageUrls.forEach(originalUrl => {
      if (!keptImageUrls.includes(originalUrl)) {
          const path = getPathFromUrl(originalUrl);
          if (path) pathsToDelete.push(path);
      }
  });

  // Determine if the original featured image should be deleted.
  if (originalFeaturedUrl) {
    const isReplaced = !!newFeaturedFile;
    const isDeselected = !isFeatured;
    const isManuallyRemoved = !isReplaced && isFeatured && !formData.get('featured_image_url');

    if (isReplaced || isDeselected || isManuallyRemoved) {
        const path = getPathFromUrl(originalFeaturedUrl);
        if (path) pathsToDelete.push(path);
    }
  }


  if (pathsToDelete.length > 0) {
      console.log('Deleting paths from storage:', pathsToDelete);
      const { error: deleteError } = await supabase.storage.from('images').remove(pathsToDelete);
      if (deleteError) {
          console.error("Failed to delete some images from storage:", deleteError.message);
          // We don't throw here, just log the error, so the rest of the update can proceed.
      }
  }

  // --- 3. HANDLE NEW IMAGE UPLOADS ---
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

  // --- 4. CONSTRUCT FINAL UPDATE OBJECT ---
  const finalImageUrls = [...keptImageUrls, ...uploadedImageUrls];
  let finalFeaturedImageUrl: string | null | undefined = uploadedFeaturedImageUrl;
    if (!uploadedFeaturedImageUrl) {
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

  // --- 5. UPDATE DATABASE RECORD ---
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
 * Fetches all trip days and their related tour package name.
 */
export async function getTripDays(): Promise<any[]> {
    const supabase = createBrowserClient();
    const { data, error } = await supabase
        .from('trip_days')
        .select(`
            id,
            day_name,
            day_number,
            status,
            activities ( count ),
            tour_package:tour_packages!inner( name )
        `)
        .order('tour_package_id')
        .order('day_number');

    if (error) {
        console.error('Error fetching trip days:', error);
        return [];
    }
    
    // The query now returns activities as an array with a single object: [{ count: N }]
    // We need to transform this to a simple number.
    return data.map(day => ({
        ...day,
        activities_count: Array.isArray(day.activities) && day.activities.length > 0 ? day.activities[0].count : 0
    }));
}

/**
 * Fetches a single trip day by its ID.
 */
export async function getTripDayById(id: string): Promise<TripDay | null> {
    const supabase = createBrowserClient();
    const { data, error } = await supabase
        .from('trip_days')
        .select(`
            *,
            tour_package:tour_packages(name)
        `)
        .eq('id', id)
        .single();
    
    if (error) {
        console.error(`Error fetching trip day ${id}:`, error);
        return null;
    }
    
    // Also fetch activities for this day
    const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .eq('trip_day_id', id)
        .order('time');
        
    if (activitiesError) {
        console.error(`Error fetching activities for trip day ${id}:`, activitiesError);
        // Return day data even if activities fail
    }

    return { ...data, activities: activities || [] } as TripDay;
}

/**
 * Creates a new trip day and its activities.
 */
export async function createTripDay(tripDayData: Partial<TripDay>) {
    const supabase = createAdminClient();
    const { activities, ...dayData } = tripDayData;

    // Insert the trip day first
    const { data: newDay, error: dayError } = await supabase
        .from('trip_days')
        .insert(dayData)
        .select()
        .single();

    if (dayError) {
        console.error('Error creating trip day:', dayError);
        throw new Error(dayError.message);
    }

    // If activities exist, insert them with the new trip_day_id
    if (activities && activities.length > 0) {
        const activitiesToInsert = activities.map(act => ({ ...act, trip_day_id: newDay.id }));
        const { error: activitiesError } = await supabase
            .from('activities')
            .insert(activitiesToInsert);

        if (activitiesError) {
            console.error('Error creating activities:', activitiesError);
            // Optionally, delete the created trip day for atomicity
            await supabase.from('trip_days').delete().eq('id', newDay.id);
            throw new Error(`Failed to create activities: ${activitiesError.message}`);
        }
    }

    return newDay;
}

/**
 * Updates a trip day and its activities.
 */
export async function updateTripDay(id: string, tripDayData: Partial<TripDay>) {
    const supabase = createAdminClient();
    const { activities, ...dayData } = tripDayData;

    // Update the trip day details
    const { data: updatedDay, error: dayError } = await supabase
        .from('trip_days')
        .update(dayData)
        .eq('id', id)
        .select()
        .single();

    if (dayError) {
        console.error('Error updating trip day:', dayError);
        throw new Error(dayError.message);
    }

    // --- Sync Activities ---
    // 1. Get existing activity IDs for this trip day
    const { data: existingActivities, error: fetchError } = await supabase
        .from('activities')
        .select('id')
        .eq('trip_day_id', id);

    if (fetchError) {
        console.error('Error fetching existing activities:', fetchError);
        throw new Error(fetchError.message);
    }
    const existingIds = existingActivities.map(a => a.id);
    
    // 2. Separate incoming activities into "new" and "to be updated"
    const incomingIds = (activities || []).map(a => a.id).filter(Boolean);
    const newActivities = (activities || []).filter(a => !a.id);
    const updatedActivities = (activities || []).filter(a => a.id);
    
    // 3. Determine which activities to delete
    const idsToDelete = existingIds.filter(existingId => !incomingIds.includes(existingId));

    // 4. Perform DB operations
    if (idsToDelete.length > 0) {
        const { error } = await supabase.from('activities').delete().in('id', idsToDelete);
        if (error) console.error('Error deleting activities:', error.message);
    }

    if (updatedActivities.length > 0) {
        const { error } = await supabase.from('activities').upsert(updatedActivities);
        if (error) console.error('Error updating activities:', error.message);
    }

    if (newActivities.length > 0) {
        const activitiesToInsert = newActivities.map(act => ({ ...act, trip_day_id: id }));
        const { error } = await supabase.from('activities').insert(activitiesToInsert);
        if (error) console.error('Error inserting new activities:', error.message);
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
