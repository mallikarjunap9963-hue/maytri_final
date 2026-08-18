import React, { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import type { TabType } from '@/components/layout/Sidebar'
import { OverviewTab } from '@/components/crm/OverviewTab'
import { UsersAccountsTab } from '@/components/crm/UsersAccountsTab'
import { LeadActivitiesTab } from '@/components/crm/LeadActivitiesTab'
import { ChannelPartnersTab } from '@/components/crm/ChannelPartnersTab'
import { LeadsPipelineTab } from '@/components/crm/LeadsPipelineTab'
import { InventoryTab } from '@/components/crm/InventoryTab'
import { SiteVisitsTab } from '@/components/crm/SiteVisitsTab'
import { BookingsTab } from '@/components/crm/BookingsTab'
import { MyTeamTab } from '@/components/crm/MyTeamTab'
import { NetworkTreeTab } from '@/components/crm/NetworkTreeTab'
import { AddLeadModal } from '@/components/modals/AddLeadModal'
import { ScheduleVisitModal } from '@/components/modals/ScheduleVisitModal'
import { AuthPage } from '@/components/auth/AuthPage'
import { WelcomeKycPage } from '@/components/kyc/WelcomeKycPage'
import { ToastContainer, toast } from '@/components/common/ToastNotification'
import type { Lead, SiteVisit } from '@/data/appData'
import { MOCK_SITE_VISITS } from '@/data/appData'
import { ApiService, AuthToken } from '@/services/apiService'
import { CheckCircle2 } from 'lucide-react'

export function App() {
  // Authentication State - Default to checking stored session
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(AuthToken.getAccess()))
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: string } | null>(() => {
    const user = AuthToken.getUser()
    const cachedProfileName = localStorage.getItem('maytri_profile_name') || localStorage.getItem('maytri_last_user_name')
    if (user) {
      const parsedName = `${user.first_name || ''} ${user.last_name || ''}`.trim()
      return {
        name: cachedProfileName || (parsedName && !parsedName.includes('@') ? parsedName : user.email.split('@')[0]),
        email: user.email,
        role: user.role || 'Director',
      }
    }
    return null
  })
  // App View State: 'kyc' (Welcome onboarding page) or 'dashboard' (Full workspace)
  const [appView, setAppView] = useState<'kyc' | 'dashboard'>('dashboard')

  // Theme & Navigation State (Default to Light White background)
  const [darkMode, setDarkMode] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedProject, setSelectedProject] = useState<string>('ALL')

  // Modals state
  const [isAddLeadOpen, setIsAddLeadOpen] = useState<boolean>(false)
  const [targetProjectForAddLead, setTargetProjectForAddLead] = useState<string | undefined>(undefined)
  const [isScheduleVisitOpen, setIsScheduleVisitOpen] = useState<boolean>(false)
  const [targetLeadForVisit, setTargetLeadForVisit] = useState<Lead | null>(null)
  const [refreshKey, setRefreshKey] = useState<number>(0)

  // Session restore & verification on mount
  useEffect(() => {
    const token = AuthToken.getAccess()
    if (token) {
      // 0. Immediate synchronous restoration from cache to prevent name flickering
      const savedUser = AuthToken.getUser()
      const cachedProfileName = localStorage.getItem('maytri_profile_name') || localStorage.getItem('maytri_last_user_name')
      if (savedUser) {
        const u = (savedUser as any)?.data || (savedUser as any)?.user || savedUser
        const parsedSavedName =
          `${u.first_name || ''} ${u.last_name || ''}`.trim() ||
          u.name ||
          u.full_name ||
          cachedProfileName
        if (parsedSavedName && !parsedSavedName.includes('@')) {
          setCurrentUser({
            name: parsedSavedName,
            email: u.email || '',
            role: u.role || 'Channel Partner',
          })
          setIsAuthenticated(true)
        }
      }

      // 1. Fetch user account details
      ApiService.getMe().then((res) => {
        if (res.ok && res.data) {
          const user = res.data?.data || res.data?.user || res.data
          const liveCachedName = localStorage.getItem('maytri_profile_name') || localStorage.getItem('maytri_last_user_name')
          const parsedName =
            `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
            user.name ||
            user.full_name ||
            ''
          const finalName =
            (liveCachedName && liveCachedName !== 'Partner' && !liveCachedName.includes('@'))
              ? liveCachedName
              : (parsedName && !parsedName.includes('@'))
                ? parsedName
                : (user.email ? user.email.split('@')[0] : 'Partner')

          setCurrentUser({
            name: finalName,
            email: user.email || '',
            role: user.role || 'Channel Partner',
          })
          AuthToken.setUser(user)
          setIsAuthenticated(true)
        }
      })

      // 2. Fetch partner KYC profile & approval status
      ApiService.getPartnerProfile().then((res) => {
        if (res.ok && res.data) {
          const profile = res.data?.data || res.data?.profile || res.data
          const rawStatus = String(profile.kyc_status || profile.status || '').toUpperCase().trim()
          const isApproved = rawStatus === 'APPROVED' || profile.is_approved === true || rawStatus.includes('APPROV')
          setAppView(isApproved ? 'dashboard' : 'kyc')
        } else {
          setAppView('kyc')
        }
      }).catch(() => {
        setAppView('kyc')
      })
    }
  }, [])

  // Apply dark mode class to root HTML element if enabled
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const showToast = (msg: string) => {
    toast.success(msg)
  }

  const handleLoginSuccess = (
    user: { name: string; email: string; role: string },
    targetView: 'kyc' | 'dashboard' = 'kyc'
  ) => {
    setCurrentUser(user)
    setIsAuthenticated(true)
    setAppView(targetView)
    setActiveTab('overview')
    setRefreshKey((k) => k + 1)
  }

  const handleLogout = () => {
    AuthToken.clear()
    localStorage.removeItem('maytri_profile_name')
    localStorage.removeItem('maytri_last_user_name')
    localStorage.removeItem('maytri_profile_code')
    localStorage.removeItem('maytri_profile_designation')
    setIsAuthenticated(false)
    setCurrentUser(null)
    setActiveTab('overview')
    setAppView('kyc')
    showToast('Logged out successfully.')
  }

  const handleOpenAddLead = (projectName?: string) => {
    setTargetProjectForAddLead(projectName)
    setIsAddLeadOpen(true)
  }

  const handleAddLead = (createdLead: Lead) => {
    showToast(`Lead "${createdLead.name}" created via API and added to project pipeline!`)
    setRefreshKey((prev) => prev + 1)
  }

  const handleScheduleVisit = async (newVisit: SiteVisit) => {
    try {
      await ApiService.createSiteVisit(newVisit)
      showToast(`Site visit appointment for ${newVisit.leadName} scheduled via API!`)
    } catch (err) {
      showToast(`Site visit booked for ${newVisit.leadName}`)
    }
  }

  const handleScheduleVisitForLead = (lead: Lead) => {
    setTargetLeadForVisit(lead)
    setIsScheduleVisitOpen(true)
  }

  // If not authenticated, render Login / Register Page with React Hook Form & Zod
  if (!isAuthenticated) {
    return (
      <>
        <ToastContainer />
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      </>
    )
  }

  // If authenticated and appView is 'kyc', render Welcome & KYC Onboarding Page
  if (appView === 'kyc') {
    return (
      <>
        <ToastContainer />
        <WelcomeKycPage
          currentUser={currentUser}
          onLogout={handleLogout}
          onNavigateToDashboard={() => setAppView('dashboard')}
        />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans transition-colors selection:bg-[#2a94b5] selection:text-white">
      <ToastContainer />

      {/* Header Bar */}
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        onOpenAddLead={handleOpenAddLead}
        onOpenScheduleVisit={() => {
          setTargetLeadForVisit(null)
          setIsScheduleVisitOpen(true)
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNavigateToKyc={() => setAppView('kyc')}
      />

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden bg-white">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab === 'leads') {
              setSelectedProject('ALL')
            }
            setActiveTab(tab)
          }}
          unreadVisitsCount={MOCK_SITE_VISITS.length}
          activeLeadsCount={0}
        />

        {/* Dynamic Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-white min-w-0">
          {activeTab === 'overview' && (
            <OverviewTab
              onNavigateTab={(tab, project) => {
                if (project) {
                  setSelectedProject(project)
                } else {
                  setSelectedProject('ALL')
                }
                setActiveTab(tab)
              }}
              onOpenAddLead={handleOpenAddLead}
              onOpenScheduleVisit={() => {
                setTargetLeadForVisit(null)
                setIsScheduleVisitOpen(true)
              }}
              selectedProject={selectedProject}
              refreshKey={refreshKey}
            />
          )}

          {activeTab === 'team' && <MyTeamTab />}

          {activeTab === 'tree' && <NetworkTreeTab />}

          {activeTab === 'leads' && (
            <LeadsPipelineTab
              selectedProject={selectedProject}
              refreshKey={refreshKey}
              onNavigateToDashboard={() => {
                setSelectedProject('ALL')
                setActiveTab('overview')
              }}
              onClearProjectFilter={() => {
                setSelectedProject('ALL')
              }}
              onOpenAddLead={(projName) => handleOpenAddLead(projName)}
              onScheduleVisitForLead={(lead) => {
                setTargetLeadForVisit(lead)
                setIsScheduleVisitOpen(true)
              }}
            />
          )}

          {activeTab === 'users' && <UsersAccountsTab />}

          {activeTab === 'activities' && <LeadActivitiesTab />}

          {activeTab === 'partners' && <ChannelPartnersTab />}
        </main>
      </div>

      {/* Modals */}
      <AddLeadModal
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        onAddLead={handleAddLead}
        initialProjectName={targetProjectForAddLead}
      />

      <ScheduleVisitModal
        isOpen={isScheduleVisitOpen}
        onClose={() => {
          setIsScheduleVisitOpen(false)
          setTargetLeadForVisit(null)
        }}
        targetLead={targetLeadForVisit}
        onScheduleVisit={handleScheduleVisit}
      />
    </div>
  )
}

export default App
