
"use server"

import { supabase } from './client'
import mockData from '@/lib/data'
import { TourPackage } from '@/lib/types'

/**
 * Fetches all tour packages.
 * In a real application, this would fetch from Supabase.
 * For now, it returns mock data.
 */
export async function getTourPackages(): Promise<TourPackage[]> {
  // TODO: Replace with actual Supabase query
  // const { data, error } = await supabase.from('tour_packages').select('*')
  // if (error) {
  //   console.error('Error fetching tour packages:', error)
  //   return []
  // }
  // return data as TourPackage[]
  
  // Returning mock data for now
  return Promise.resolve(mockData.tourPackages);
}

/**
 * Fetches a single tour package by its ID.
 */
export async function getTourPackageById(id: string): Promise<TourPackage | null> {
    // TODO: Replace with actual Supabase query
    // const { data, error } = await supabase.from('tour_packages').select('*').eq('id', id).single()
    // if (error) {
    //   console.error(`Error fetching tour package ${id}:`, error)
    //   return null
    // }
    // return data as TourPackage | null
    
    // Returning mock data for now
    const pkg = mockData.tourPackages.find(p => p.id === id) || null;
    return Promise.resolve(pkg);
}
