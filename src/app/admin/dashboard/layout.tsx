'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { getCurrentUser, getAdminUser, signOut } from '@/lib/auth'
import { Loader2, LayoutDashboard, FileText, Send, LogOut, BarChart3, Menu, X, Users } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [adminUser, setAdminUser] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { user, error } = await getCurrentUser()
    
    if (error || !user) {
      router.push('/admin/login')
      return
    }

    const { data: admin, error: adminError } = await getAdminUser(user.id)
    
    if (adminError || !admin) {
      toast({
        title: 'Access Denied',
        description: 'You do not have admin access.',
        variant: 'destructive',
      })
      router.push('/admin/login')
      return
    }

    setAdminUser(admin)
    setLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
    toast({
      title: 'Signed out',
      description: 'You have been successfully signed out.',
    })
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const NavigationContent = () => (
    <>
      <nav className="flex-1 p-4 space-y-2">
        <Link href="/admin/dashboard" onClick={() => setMobileMenuOpen(false)}>
          <Button variant={pathname === '/admin/dashboard' ? 'secondary' : 'ghost'} className="w-full justify-start">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </Link>
        <Link href="/admin/dashboard/surveys" onClick={() => setMobileMenuOpen(false)}>
          <Button variant={pathname?.startsWith('/admin/dashboard/surveys') ? 'secondary' : 'ghost'} className="w-full justify-start">
            <FileText className="mr-2 h-4 w-4" />
            Surveys
          </Button>
        </Link>
        <Link href="/admin/dashboard/send" onClick={() => setMobileMenuOpen(false)}>
          <Button variant={pathname === '/admin/dashboard/send' ? 'secondary' : 'ghost'} className="w-full justify-start">
            <Send className="mr-2 h-4 w-4" />
            Send Surveys
          </Button>
        </Link>
        <Link href="/admin/dashboard/responses" onClick={() => setMobileMenuOpen(false)}>
          <Button variant={pathname === '/admin/dashboard/responses' ? 'secondary' : 'ghost'} className="w-full justify-start">
            <BarChart3 className="mr-2 h-4 w-4" />
            Responses
          </Button>
        </Link>
        {adminUser?.role === 'company_admin' && (
          <Link href="/admin/dashboard/users" onClick={() => setMobileMenuOpen(false)}>
            <Button variant={pathname === '/admin/dashboard/users' ? 'secondary' : 'ghost'} className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" />
              Team
            </Button>
          </Link>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="mb-4">
          <p className="text-sm font-medium truncate">{adminUser?.full_name}</p>
          <p className="text-xs text-gray-600 truncate">{adminUser?.email}</p>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => {
            handleSignOut()
            setMobileMenuOpen(false)
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center px-4">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-4">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-gray-200">
                <h1 className="text-xl font-bold text-primary">Survey Insights</h1>
                <p className="text-sm text-gray-600 mt-1 truncate">{adminUser?.companies?.name}</p>
              </div>
              <NavigationContent />
            </div>
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-bold text-primary">Survey Insights</h1>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-30">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-primary">Survey Insights</h1>
            <p className="text-sm text-gray-600 mt-1">{adminUser?.companies?.name}</p>
          </div>
          <NavigationContent />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  )
}

