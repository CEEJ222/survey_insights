import { supabase } from './supabase/client'

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export async function getAdminUser(userId: string) {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*, companies(*)')
    .eq('id', userId)
    .single()
  
  return { data, error }
}

export async function checkUserRole(userId: string, allowedRoles: string[]) {
  const { data, error } = await supabase
    .from('admin_users')
    .select('role, is_active')
    .eq('id', userId)
    .single()

  if (error || !data) {
    return { hasPermission: false, error }
  }

  const hasPermission = (data as any).is_active && allowedRoles.includes((data as any).role)
  return { hasPermission, role: (data as any).role, isActive: (data as any).is_active }
}

export async function isCompanyAdmin(userId: string) {
  const { hasPermission } = await checkUserRole(userId, ['company_admin'])
  return hasPermission
}

export async function canManageSurveys(userId: string) {
  const { hasPermission } = await checkUserRole(userId, ['company_admin', 'admin'])
  return hasPermission
}

export async function canManageUsers(userId: string) {
  const { hasPermission } = await checkUserRole(userId, ['company_admin'])
  return hasPermission
}

