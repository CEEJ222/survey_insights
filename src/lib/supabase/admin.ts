import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from './server'

// Export the createClient function for use in other modules
export { createClient }

// Helper function to get admin user
export async function getAdminUser(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching admin user:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in getAdminUser:', error)
    return { data: null, error }
  }
}
