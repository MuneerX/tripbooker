
"use server"

import { createClient as createServerClient } from './server'
import { createClient as createBrowserClient } from './client'

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

/**
 * Creates a new tour package in Supabase.
 */
export async function createTourPackage(pkg: Partial<TourPackage>) {
  const supabase = createServerClient();
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
 * Uploads tour images to Supabase Storage and creates a new tour package.
 */
export async function uploadTourImages(formData: FormData) {
  const supabase = createServerClient();

  const imageFiles = formData.getAll('image_files') as File[];
  const featuredImageFile = formData.get('featured_image_file') as File | null;

  const imageUrls: string[] = [];
  let featuredImageUrl: string | undefined = undefined;

  // Upload gallery images
  for (const file of imageFiles) {
    const filePath = `tour_images/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('tour-images').upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage.from('tour-images').getPublicUrl(filePath);
    imageUrls.push(publicUrl);
  }

  // Upload featured image if it exists
  if (featuredImageFile) {
    const filePath = `tour_images/featured/${Date.now()}-${featuredImageFile.name}`;
    const { error: uploadError } = await supabase.storage.from('tour-images').upload(filePath, featuredImageFile);

    if (uploadError) {
      console.error('Error uploading featured image:', uploadError);
      throw new Error(`Failed to upload featured image: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage.from('tour-images').getPublicUrl(filePath);
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

