
"use server"

import { supabase } from './client'
import type { TourPackage } from '@/lib/types'

/**
 * Fetches all tour packages from Supabase.
 */
export async function getTourPackages(): Promise<TourPackage[]> {
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

