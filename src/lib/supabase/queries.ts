

"use server"

import { createServerClient } from '@supabase/ssr'
import { createClient as createBrowserClient } from './client'
import { cookies } from 'next/headers'

import type { TourPackage } from '@/lib/types'

/**
 * Fetches all tour packages from Supabase.
 */
export async function getTourPackages(): Promise<TourPackage[]> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.from('tour_packages').select('*')
  
  if (error) {
    console.error('Error fetching tour packages:', error)
    return []
  }
  
  // Supabase returns dates as strings, so we need to convert them.
  // Also, we need to handle cases where dates might be null or invalid.
  return (data || []).map(pkg => ({
    ...pkg,
    created_at: pkg.created_at ? new Date(pkg.created_at) : new Date(),
    updatedAt: pkg.updated_at ? new Date(pkg.updated_at) : new Date(),
    withdrawalDate: pkg.withdrawalDate ? new Date(pkg.withdrawalDate) : new Date(),
    introductionDate: pkg.introductionDate ? new Date(pkg.introductionDate) : new Date(),
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

    return {
        ...data,
        created_at: data.created_at ? new Date(data.created_at) : new Date(),
        updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(),
        withdrawalDate: data.withdrawalDate ? new Date(data.withdrawalDate) : new Date(),
        introductionDate: data.introductionDate ? new Date(data.introductionDate) : new Date(),
    } as TourPackage;
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
  for (const file of imageFiles) {
    const filePath = `images/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
    imageUrls.push(publicUrl);
  }

  // Upload featured image if it exists
  if (featuredImageFile) {
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
 * Updates an existing tour package and handles image deletions.
 */
export async function updateTourPackage(id: string, formData: FormData) {
  const supabase = createAdminClient();

  // Helper to extract file path from URL
  const getPathFromUrl = (url: string) => {
    if (!url) return '';
    try {
      const urlObject = new URL(url);
      const pathSegment = '/storage/v1/object/public/';
      const pathname = urlObject.pathname;
      const pathStartIndex = pathname.indexOf(pathSegment);
      if (pathStartIndex !== -1) {
        return decodeURIComponent(pathname.substring(pathStartIndex + pathSegment.length));
      }
      return '';
    } catch (e) {
      console.error('Invalid URL for image deletion:', url);
      return '';
    }
  };

  const isFeatured = formData.get('is_featured') === 'true';

  // 1. Handle image deletions
  const originalImageUrls = JSON.parse(formData.get('original_image_urls') as string || '[]');
  const existingImageUrls = JSON.parse(formData.get('existing_image_urls') as string || '[]');
  const originalFeaturedUrl = formData.get('original_featured_image_url') as string || '';
  
  const galleryImagesToDelete = originalImageUrls.filter((url: string) => !existingImageUrls.includes(url));
  
  const newFeaturedImageFile = formData.get('new_featured_image_file') as File | null;
  const featuredImageWasRemovedManually = originalFeaturedUrl && !formData.has('existing_featured_image_url');
  const featuredImageIsBeingReplaced = originalFeaturedUrl && newFeaturedImageFile && newFeaturedImageFile.size > 0;
  const isNowNotFeatured = !isFeatured && originalFeaturedUrl;

  const allPathsToDelete: string[] = galleryImagesToDelete.map(getPathFromUrl).filter(Boolean);

  if (featuredImageWasRemovedManually || featuredImageIsBeingReplaced || isNowNotFeatured) {
      const featuredPath = getPathFromUrl(originalFeaturedUrl);
      if(featuredPath) allPathsToDelete.push(featuredPath);
  }

  if (allPathsToDelete.length > 0) {
    const { error: deleteError } = await supabase.storage.from('images').remove(allPathsToDelete);
    if (deleteError) {
        console.error("Failed to delete images from storage:", deleteError.message);
        // We can choose to either throw an error or just log it and continue.
        // For now, we'll log and continue to allow text updates to succeed.
    }
  }

  // 2. Handle Image Uploads
  const newGalleryFiles = formData.getAll('new_image_files') as File[];
  const newFeaturedFile = formData.get('new_featured_image_file') as File | null;

  const newImageUrls: string[] = [];
  let newFeaturedImageUrl: string | undefined = undefined;

  // Upload new gallery images - with a check for valid files
  const validNewGalleryFiles = newGalleryFiles.filter(file => file instanceof File && file.size > 0);
  if (validNewGalleryFiles.length > 0) {
    for (const file of validNewGalleryFiles) {
      const filePath = `images/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
      if (uploadError) throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
      newImageUrls.push(publicUrl);
    }
  }

  // Upload new featured image
  if (newFeaturedFile && newFeaturedFile.size > 0) {
    const filePath = `images/featured/${Date.now()}-${newFeaturedFile.name}`;
    const { error: uploadError } = await supabase.storage.from('images').upload(filePath, newFeaturedFile);
    if (uploadError) throw new Error(`Failed to upload featured image: ${uploadError.message}`);
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
    newFeaturedImageUrl = publicUrl;
  }
  
  // 3. Construct the update object
  const finalImageUrls = [...existingImageUrls, ...newImageUrls];
  let finalFeaturedImageUrl = newFeaturedImageUrl ?? (formData.get('existing_featured_image_url') as string || '');
  
  // If no longer featured, ensure the URL is null
  if (!isFeatured) {
    finalFeaturedImageUrl = '';
  }
  
  const updateData: { [key: string]: any } = {
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
    featured_image_url: finalFeaturedImageUrl || null,
    updated_at: new Date().toISOString(),
  };
  
   // Remove undefined keys so they don't overwrite existing values with null
   Object.keys(updateData).forEach(key => {
     if (updateData[key] === undefined) {
       delete updateData[key];
     }
   });

  // 4. Update the database record
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

