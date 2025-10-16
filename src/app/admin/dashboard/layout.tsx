'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { getCurrentUser, getAdminUser, signOut } from '@/lib/auth'
import { 
  Loader2, 
  LayoutDashboard, 
  FileText, 
  Send, 
  LogOut, 
  BarChart3, 
  Menu, 
  Users, 
  Bot,
  Target,
  Mic,
  Star,
  Lightbulb,
  Settings,
  Tag,
  ChevronRight,
  MessageSquare
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

// Navigation structure definition
type NavItem = {
  label: string
  href: string
  icon: any
  badge?: string
  subItems?: SubNavItem[]
}

type SubNavItem = {
  label: string
  href: string
  badge?: string
}

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

  // Define navigation structure
  const navigationItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Surveys',
      href: '/admin/dashboard/surveys',
      icon: FileText,
      subItems: [
        { label: 'All Surveys', href: '/admin/dashboard/surveys' },
        { label: 'Create Survey', href: '/admin/dashboard/surveys/new' },
        { label: 'Send Surveys', href: '/admin/dashboard/send' },
        { label: 'Responses', href: '/admin/dashboard/responses' },
      ]
    },
    {
      label: 'Roadmap',
      href: '/admin/dashboard/roadmap',
      icon: Target,
      badge: 'Soon',
      subItems: [
        { label: 'All Items', href: '/admin/dashboard/roadmap', badge: 'Soon' },
        { label: 'Impact vs Effort', href: '/admin/dashboard/roadmap/matrix', badge: 'Soon' },
        { label: 'Themes', href: '/admin/dashboard/roadmap/themes', badge: 'Soon' },
        { label: 'Timeline', href: '/admin/dashboard/roadmap/timeline', badge: 'Soon' },
      ]
    },
    {
      label: 'Interviews',
      href: '/admin/dashboard/interviews',
      icon: Mic,
      badge: 'Soon',
      subItems: [
        { label: 'All Interviews', href: '/admin/dashboard/interviews', badge: 'Soon' },
        { label: 'Schedule', href: '/admin/dashboard/interviews/schedule', badge: 'Soon' },
        { label: 'Transcripts', href: '/admin/dashboard/interviews/transcripts', badge: 'Soon' },
      ]
    },
    {
      label: 'Reviews',
      href: '/admin/dashboard/reviews',
      icon: Star,
      badge: 'Soon',
      subItems: [
        { label: 'All Reviews', href: '/admin/dashboard/reviews', badge: 'Soon' },
        { label: 'G2', href: '/admin/dashboard/reviews/g2', badge: 'Soon' },
        { label: 'Trustpilot', href: '/admin/dashboard/reviews/trustpilot', badge: 'Soon' },
        { label: 'Google', href: '/admin/dashboard/reviews/google', badge: 'Soon' },
      ]
    },
    {
      label: 'Insights',
      href: '/admin/dashboard/insights',
      icon: Lightbulb,
      badge: 'Soon',
      subItems: [
        { label: 'Overview', href: '/admin/dashboard/insights', badge: 'Soon' },
        { label: 'Cross-Channel', href: '/admin/dashboard/insights/cross-channel', badge: 'Soon' },
        { label: 'Tag Cloud', href: '/admin/dashboard/insights/tags', badge: 'Soon' },
        { label: 'Themes', href: '/admin/dashboard/insights/themes', badge: 'Soon' },
        { label: 'Sentiment Trends', href: '/admin/dashboard/insights/sentiment', badge: 'Soon' },
      ]
    },
    {
      label: 'Customers',
      href: '/admin/dashboard/customers',
      icon: Users,
      subItems: [
        { label: 'All Customers', href: '/admin/dashboard/customers' },
        { label: 'Health Score', href: '/admin/dashboard/customers/health', badge: 'Soon' },
        { label: 'Segments', href: '/admin/dashboard/customers/segments', badge: 'Soon' },
      ]
    },
    {
      label: 'Settings',
      href: '/admin/dashboard/settings',
      icon: Settings,
      subItems: [
        { label: 'General', href: '/admin/dashboard/settings', badge: 'Soon' },
        { label: 'Team', href: '/admin/dashboard/users' },
        { label: 'Tags & Themes', href: '/admin/dashboard/settings/tags' },
        { label: 'Integrations', href: '/admin/dashboard/settings/integrations', badge: 'Soon' },
      ]
    },
  ]

  // Add AI Test for development (temporary)
  if (process.env.NODE_ENV === 'development') {
    navigationItems.push({
      label: 'AI Test',
      href: '/admin/dashboard/ai-test',
      icon: Bot,
    })
  }

  const NavigationContent = () => {
    const [expandedSection, setExpandedSection] = useState<string | null>(null)

    // Auto-expand section based on current path
    useEffect(() => {
      const activeSection = navigationItems.find(item => 
        pathname?.startsWith(item.href) && item.subItems
      )
      if (activeSection) {
        setExpandedSection(activeSection.label)
      }
    }, [pathname])

    return (
      <>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            const isExpanded = expandedSection === item.label
            const Icon = item.icon

            return (
              <div key={item.label}>
                {/* Primary Nav Item */}
                <div className="relative">
                  <Link 
                    href={item.badge === 'Soon' ? '#' : item.href} 
                    onClick={(e) => {
                      if (item.badge === 'Soon') {
                        e.preventDefault()
                        return
                      }
                      if (item.subItems) {
                        e.preventDefault()
                        setExpandedSection(isExpanded ? null : item.label)
                        if (!isExpanded && item.href) {
                          router.push(item.href)
                        }
                      } else {
                        setMobileMenuOpen(false)
                      }
                    }}
                  >
                    <Button 
                      variant={isActive ? 'secondary' : 'ghost'} 
                      className={`w-full justify-start ${item.badge === 'Soon' ? 'opacity-60' : ''}`}
                      disabled={item.badge === 'Soon'}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                          {item.badge}
                        </span>
                      )}
                      {item.subItems && !item.badge && (
                        <ChevronRight className={`ml-auto h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      )}
                    </Button>
                  </Link>
                </div>

                {/* Secondary Nav Items */}
                {item.subItems && isExpanded && !item.badge && (
                  <div className="ml-6 mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
                    {item.subItems.map((subItem) => {
                      const isSubActive = pathname === subItem.href
                      return (
                        <Link 
                          key={subItem.href} 
                          href={subItem.badge === 'Soon' ? '#' : subItem.href}
                          onClick={(e) => {
                            if (subItem.badge === 'Soon') {
                              e.preventDefault()
                              return
                            }
                            setMobileMenuOpen(false)
                          }}
                        >
                          <Button 
                            variant={isSubActive ? 'secondary' : 'ghost'} 
                            size="sm"
                            className={`w-full justify-start text-sm ${subItem.badge === 'Soon' ? 'opacity-60' : ''}`}
                            disabled={subItem.badge === 'Soon'}
                          >
                            <span className="flex-1 text-left">{subItem.label}</span>
                            {subItem.badge && (
                              <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                                {subItem.badge}
                              </span>
                            )}
                          </Button>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="mb-4">
            <p className="text-sm font-medium truncate">{adminUser?.full_name}</p>
            <p className="text-xs text-gray-600 truncate">{adminUser?.email}</p>
            {adminUser?.role === 'company_admin' && (
              <span className="inline-block mt-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                Admin
              </span>
            )}
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
  }

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

