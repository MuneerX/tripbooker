
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
  return data.map(pkg => ({
    ...pkg,
    introductionDate: new Date(pkg.introductionDate),
    withdrawalDate: new Date(pkg.withdrawalDate),
    createdAt: new Date(pkg.createdAt),
    updatedAt: new Date(pkg.updatedAt),
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
        introductionDate: new Date(data.introductionDate),
        withdrawalDate: new Date(data.withdrawalDate),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
    } as TourPackage;
}

/**
 * Creates a new tour package in Supabase.
 */
export async function createTourPackage(pkg: Omit<TourPackage, 'id' | 'createdAt' | 'updatedAt'>) {
  const { data, error } = await supabase.from('tour_packages').insert([pkg]).select().single();

  if (error) {
    console.error('Error creating tour package:', error);
    throw new Error(error.message);
  }

  return data;
}
