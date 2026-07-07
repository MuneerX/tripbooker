import { getProfiles, getBookings } from './src/lib/supabase/queries.js';

async function test() {
  try {
    console.log('Testing getProfiles...');
    const profiles = await getProfiles();
    console.log('Profiles fetched:', profiles.length);
  } catch (e) {
    console.error('Error in getProfiles:', e);
  }
  
  try {
    console.log('Testing getBookings...');
    const bookings = await getBookings();
    console.log('Bookings fetched:', bookings.length);
  } catch (e) {
    console.error('Error in getBookings:', e);
  }
}

test();
