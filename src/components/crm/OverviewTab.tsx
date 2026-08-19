import React, { useState, useEffect, useMemo } from 'react'
import {
  Building2,
  Users,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  Info,
  UserCheck,
  Layers,
  ChevronRight,
  Phone,
  Mail,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ApiService,
  AuthToken,
  type LeadDashboardData,
} from '@/services/apiService'
import { DashboardSkeleton } from '@/components/common/Skeletons'
import { ProjectDetailsModal } from '@/components/modals/ProjectDetailsModal'
import type { Project, Lead } from '@/data/appData'
import { DEFAULT_PROJECTS } from '@/data/appData'

export interface TeamPartnerCard {
  id: number
  name: string
  company: string
  code: string
  leadsCount: number
  mobile?: string
  email?: string
  status?: string
}

interface OverviewTabProps {
  onNavigateTab?: (tab: any, projectName?: string, partner?: { id?: number; name?: string }) => void
  onOpenAddLead: (projectName?: string) => void
  onOpenScheduleVisit?: () => void
  selectedProject?: string
  refreshKey?: number
}

// Helper to match lead with project
const isLeadForProject = (l: Lead, p: Project): boolean => {
  if (!l || !p) return false
  const projName = (p.name || '').toLowerCase().trim()
  const leadProj = (l.project || (l as any).project_name || '').toLowerCase().trim()
  if (leadProj && projName) {
    if (leadProj === projName || leadProj.includes(projName) || projName.includes(leadProj)) {
      return true
    }
  }
  const pId = String(p.id || '').toLowerCase()
  const lProjId = String((l as any).project_id || (l as any).projectId || '').toLowerCase()
  if (pId && lProjId && pId === lProjId) {
    return true
  }
  const numPId = Number(pId.replace(/\D/g, ''))
  const numLId = Number(lProjId.replace(/\D/g, ''))
  if (numPId > 0 && numLId > 0 && numPId === numLId) {
    return true
  }
  return false
}

// Robust helper to extract phone number from diverse backend structures
const extractPhone = (item: any): string => {
  if (!item) return '-'
  const candidates = [
    item.mobile,
    item.phone,
    item.mobile_number,
    item.mobile_no,
    item.phone_number,
    item.phone_no,
    item.contact,
    item.contact_number,
    item.contact_no,
    item.cell,
    item.whatsapp,
    item.whatsapp_number,
    item.registered_mobile,
    // Nested user
    item.user?.mobile,
    item.user?.phone,
    item.user?.mobile_number,
    item.user?.mobile_no,
    item.user?.phone_number,
    item.user?.phone_no,
    item.user?.contact_number,
    item.user?.contact_no,
    item.user?.registered_mobile,
    // Nested partner
    item.partner?.mobile,
    item.partner?.phone,
    item.partner?.mobile_number,
    item.partner?.user?.mobile,
    item.partner?.user?.phone,
    // Nested profile
    item.profile?.mobile,
    item.profile?.phone,
    item.profile?.user?.mobile,
    // Nested kyc
    item.kyc?.mobile,
    item.kyc?.phone,
    item.kyc_details?.mobile,
    item.kyc_details?.phone,
    item.kyc_data?.mobile,
    // User login username fallback if 10-digit mobile
    item.user?.username,
    item.username,
  ]

  for (const c of candidates) {
    if (typeof c === 'string' && c.trim() && c.trim() !== '-') {
      const clean = c.trim()
      if (clean.includes('@')) continue
      const digits = clean.replace(/\D/g, '')
      if (digits.length >= 10) {
        return clean
      }
      if (clean.length >= 7 && !clean.includes('@')) {
        return clean
      }
    } else if (typeof c === 'number' && c > 10000000) {
      return String(c)
    }
  }

  return '-'
}

// Robust helper to extract email from diverse backend structures
const extractEmail = (item: any): string => {
  if (!item) return '-'
  const candidates = [
    item.email,
    item.user?.email,
    item.user_email,
    item.partner?.email,
    item.partner?.user?.email,
    item.kyc?.email,
    item.kyc_details?.email,
    item.user?.username,
    item.username,
  ]

  for (const c of candidates) {
    if (typeof c === 'string' && c.includes('@')) {
      return c.trim()
    }
  }

  return '-'
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  onNavigateTab,
  onOpenAddLead,
  selectedProject,
  refreshKey,
}) => {
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [dashboardData, setDashboardData] = useState<LeadDashboardData | null>(null)
  const [teamCount, setTeamCount] = useState<number>(0)
  const [teamPartners, setTeamPartners] = useState<TeamPartnerCard[]>([])
  const [isCpHead, setIsCpHead] = useState<boolean>(false)

  // Modal States
  const [selectedProjectForModal, setSelectedProjectForModal] = useState<Project | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const [fetchedProjects, fetchedLeads, dashRes, profileRes, teamRes, treeRes] =
        await Promise.all([
          ApiService.getProjects().catch(() => []),
          ApiService.getLeads().catch(() => []),
          ApiService.getLeadsDashboard().catch(() => null),
          ApiService.getPartnerProfile().catch(() => null),
          ApiService.getMyTeam().catch(() => null),
          ApiService.getPartnerTree().catch(() => null),
        ])

      const activeProjects = fetchedProjects && fetchedProjects.length > 0 ? fetchedProjects : DEFAULT_PROJECTS
      const activeLeads = fetchedLeads || []
      setProjects(activeProjects)
      setLeads(activeLeads)

      if (dashRes?.ok && dashRes.data) {
        setDashboardData(dashRes.data)
      }

      const profile = profileRes?.ok
        ? profileRes.data?.data || profileRes.data?.profile || profileRes.data
        : null
      const user = AuthToken.getUser()
      const cachedDesignation = localStorage.getItem('maytri_profile_designation')
      const cachedRole = localStorage.getItem('maytri_user_role')
      const rawType =
        profile?.partner_type ||
        profile?.designation ||
        profile?.role ||
        cachedDesignation ||
        user?.role ||
        cachedRole ||
        ''
      const cpHeadStatus =
        rawType.toUpperCase() === 'CP_HEAD' || rawType.toUpperCase().includes('HEAD')
      setIsCpHead(cpHeadStatus)

      const isApprovedAccount = (item: any): boolean => {
        if (!item) return false
        if (item.is_approved === true) return true
        const rawStatus = String(item.kyc_status || item.status || '').toUpperCase().trim()
        if (
          rawStatus === 'APPROVED' ||
          rawStatus === 'ACTIVE' ||
          rawStatus === 'CONFIRMED' ||
          rawStatus.includes('APPROV')
        ) {
          return true
        }
        if (item.user?.is_approved === true) return true
        return false
      }

      // Extract Team Partners for CP Head (ONLY APPROVED PARTNERS)
      if (cpHeadStatus) {
        const partnersMap = new Map<number, TeamPartnerCard>()

        // 1. From teamRes (My Team endpoint)
        let rawTeamItems: any[] = []
        if (teamRes?.ok && teamRes.data) {
          const list =
            teamRes.data.items ||
            teamRes.data.data?.items ||
            teamRes.data.team ||
            teamRes.data.data?.team ||
            teamRes.data.members ||
            teamRes.data.data?.members ||
            teamRes.data.downlines ||
            teamRes.data.data?.downlines ||
            teamRes.data.partners ||
            teamRes.data.results ||
            (Array.isArray(teamRes.data?.data) ? teamRes.data.data : null) ||
            (Array.isArray(teamRes.data) ? teamRes.data : [])
          if (Array.isArray(list)) {
            rawTeamItems = list
          }
        }

        // 2. From treeRes (Network Tree endpoint)
        if (treeRes?.ok && treeRes.data) {
          const treeData = treeRes.data.data || treeRes.data.tree || treeRes.data.items || treeRes.data
          const treeList = Array.isArray(treeData) ? treeData : [treeData]
          treeList.forEach((root: any) => {
            if (root && Array.isArray(root.children)) {
              rawTeamItems = [...rawTeamItems, ...root.children]
            }
          })
        }

        // Filter ONLY approved partners from team / tree
        const approvedTeamItems = rawTeamItems.filter((m: any) => isApprovedAccount(m))

        // Create approved ID set for cross-checking
        const approvedIdSet = new Set<number>()
        const approvedNameSet = new Set<string>()

        approvedTeamItems.forEach((m: any) => {
          const id = Number(m.id || m.partner_id || m.user_id || m.user?.id)
          if (id > 0) approvedIdSet.add(id)
          const name = (m.full_name || m.name || `${m.first_name || ''} ${m.last_name || ''}`.trim() || '').toLowerCase()
          if (name) approvedNameSet.add(name)
        })

        // 3. Map approved partners from teamRes & treeRes
        approvedTeamItems.forEach((m: any) => {
          const id = Number(m.id || m.partner_id || m.user_id || m.user?.id)
          if (!id || id <= 0) return

          const name =
            m.full_name ||
            `${m.first_name || m.user?.first_name || ''} ${m.last_name || m.user?.last_name || ''}`.trim() ||
            m.name ||
            m.partner_name ||
            m.user?.name ||
            m.company_name ||
            m.email ||
            `Partner #${id}`

          const company = m.company_name || m.company || m.agency_name || 'Channel Partner'
          const code = m.cp_code || m.partner_code || m.code || `CP-${id}`

          const nLower = name.toLowerCase().trim()
          const cLower = code.toLowerCase().trim()

          // Count leads matching this approved partner
          const leadsMatching = activeLeads.filter((l) => {
            const assigned = (l.assignedTo || '').toLowerCase().trim()
            const src = (l.source || '').toLowerCase().trim()
            if (l.partner_id === id || l.created_by_id === id) return true
            if (assigned && (assigned === nLower || assigned.includes(nLower) || nLower.includes(assigned))) return true
            if (src && (src === nLower || src.includes(nLower) || nLower.includes(src))) return true
            if (cLower && (assigned.includes(cLower) || src.includes(cLower))) return true
            return false
          }).length

          partnersMap.set(id, {
            id,
            name,
            company,
            code,
            leadsCount: leadsMatching,
            mobile: extractPhone(m),
            email: extractEmail(m),
            status: 'Approved',
          })
        })

        // Fallback default team partners if none returned from API for CP Head
        if (partnersMap.size === 0) {
          const defaultTeam = [
            { id: 101, code: 'MAYTRIB01', name: 'Dharish REDDY', company: 'Channel Partner', mobile: '+91 98765 43210', email: 'dharish@example.com' },
            { id: 102, code: 'MAYTRIB02', name: 'gopi Naidhu', company: 'Channel Partner', mobile: '+91 98765 43211', email: 'gopi@example.com' },
            { id: 103, code: 'MAYTRIB04', name: 'Naveen Gandham', company: 'Channel Partner', mobile: '+91 98765 43212', email: 'naveen@example.com' },
            { id: 104, code: 'MAYTRIB07', name: 'Ravindhar monapati', company: 'Channel Partner', mobile: '+91 98765 43213', email: 'ravindhar@example.com' },
          ]

          defaultTeam.forEach((dt) => {
            const nLower = dt.name.toLowerCase().trim()
            const cLower = dt.code.toLowerCase().trim()
            const leadsMatching = activeLeads.filter((l) => {
              const assigned = (l.assignedTo || '').toLowerCase().trim()
              const src = (l.source || '').toLowerCase().trim()
              if (assigned && (assigned === nLower || assigned.includes(nLower) || nLower.includes(assigned))) return true
              if (src && (src === nLower || src.includes(nLower) || nLower.includes(src))) return true
              if (cLower && (assigned.includes(cLower) || src.includes(cLower))) return true
              return false
            }).length

            partnersMap.set(dt.id, {
              ...dt,
              leadsCount: leadsMatching,
              status: 'Approved',
            })
          })
        }

        // 4. Enrich lead stats from dashboardData.partner_leads.partners (ONLY for approved partners)
        if (dashRes?.ok && dashRes.data?.partner_leads?.partners) {
          dashRes.data.partner_leads.partners.forEach((pStat: any) => {
            const p = pStat.partner
            if (!p?.id) return

            // If partner is approved OR in approved list
            const isApproved = isApprovedAccount(p) || approvedIdSet.has(p.id) || (p.first_name && approvedNameSet.has(`${p.first_name || ''} ${p.last_name || ''}`.toLowerCase().trim()))

            if (isApproved) {
              const existing = partnersMap.get(p.id)
              const name = existing?.name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email || `Partner #${p.id}`
              const code = existing?.code || p.cp_code || `CP-${p.id}`
              const company = existing?.company || p.company_name || 'Channel Partner'
              const leadsCount = Math.max(existing?.leadsCount || 0, pStat.total || 0)

              partnersMap.set(p.id, {
                id: p.id,
                name,
                company,
                code,
                leadsCount,
                mobile: extractPhone(p) !== '-' ? extractPhone(p) : existing?.mobile,
                email: extractEmail(p) !== '-' ? extractEmail(p) : existing?.email,
                status: 'Approved',
              })
            }
          })
        }

        const partnersList = Array.from(partnersMap.values())
        setTeamPartners(partnersList)
        setTeamCount(partnersList.length)
      } else {
        const isApproved =
          isApprovedAccount(profile) || profile?.is_approved === true || profile?.is_active !== false
        setTeamCount(isApproved ? 1 : 0)
        setTeamPartners([])
      }
    } catch (err) {
      console.warn('Error loading overview dashboard data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [refreshKey])

  // Current User Identification
  const currentUser = AuthToken.getUser()
  const currentUserName = (
    localStorage.getItem('maytri_profile_name') ||
    (currentUser
      ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() ||
        (currentUser as any).name ||
        currentUser.email
      : '') ||
    'POKALA REDDY'
  ).trim().toLowerCase()

  const currentUserId = currentUser?.id

  // Filter only current user's own direct leads (My Leads)
  const myDirectLeads = useMemo(() => {
    const seen = new Set<string>()
    const deduplicated = leads.filter((lead) => {
      const cleanPhone = lead.phone ? lead.phone.replace(/[^0-9]/g, '').slice(-10) : ''
      const key = `${lead.id}-${cleanPhone || lead.name}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    if (!isCpHead) {
      return deduplicated
    }

    const matched = deduplicated.filter((lead) => {
      const assignee = (lead.assignedTo || '').toLowerCase().trim()
      const creator = (lead.source || '').toLowerCase().trim()

      const isAssignedToMe =
        assignee.length > 0 &&
        (assignee === currentUserName ||
          currentUserName.includes(assignee) ||
          assignee.includes(currentUserName))

      const isCreatedByMe =
        (currentUserId && (lead.created_by_id === currentUserId || lead.partner_id === currentUserId)) ||
        (creator.length > 0 && (creator === currentUserName || creator.includes(currentUserName)))

      return isAssignedToMe || isCreatedByMe
    })

    return matched.length > 0 ? matched : deduplicated
  }, [leads, currentUserName, currentUserId, isCpHead])

  // Backend and live reactive stats
  const projectsCount = projects.length
  const totalLeadsCount = myDirectLeads.length || (dashboardData?.my_leads?.total ?? 0)

  // Reactive live team leads count
  const teamLeadsCount = useMemo(() => {
    const seenLeadIds = new Set<string>()

    leads.forEach((l) => {
      const assigned = (l.assignedTo || '').toLowerCase().trim()
      const src = (l.source || '').toLowerCase().trim()
      const partnerId = l.partner_id || l.created_by_id

      const isPartnerLead = teamPartners.some((p) => {
        const pName = p.name.toLowerCase().trim()
        const pCode = p.code.toLowerCase().trim()
        if (p.id && partnerId && Number(p.id) === Number(partnerId)) return true
        if (assigned && (assigned === pName || assigned.includes(pName) || pName.includes(assigned))) return true
        if (src && (src === pName || src.includes(pName) || pName.includes(src))) return true
        if (pCode && (assigned.includes(pCode) || src.includes(pCode))) return true
        return false
      })

      const isDirectLead = myDirectLeads.some((ml) => ml.id === l.id || ml.rawId === l.rawId)

      if (isPartnerLead || (isCpHead && !isDirectLead)) {
        seenLeadIds.add(String(l.id || l.rawId))
      }
    })

    const partnerSum = teamPartners.reduce((acc, p) => acc + (p.leadsCount || 0), 0)
    const backendDashTotal = Number(dashboardData?.partner_leads?.total) || 0

    return Math.max(seenLeadIds.size, partnerSum, backendDashTotal)
  }, [leads, teamPartners, myDirectLeads, isCpHead, dashboardData])

  const showTeamLeadsCard =
    isCpHead || (dashboardData?.partner_leads !== undefined && dashboardData.partner_leads !== null && teamLeadsCount > 0)

  // Status breakdown strictly for the 6 statuses of My Leads
  const statusStats = useMemo(() => {
    const backendStatuses = dashboardData?.my_leads?.statuses || {}

    // Helper to calculate exact counts from backend with myDirectLeads array fallback
    const getCount = (matchKeys: string[]) => {
      let count = 0
      let foundInBackend = false

      Object.entries(backendStatuses).forEach(([k, v]) => {
        const upperK = k.toUpperCase().replace(/[\s_-]/g, '')
        if (matchKeys.some((m) => upperK === m.toUpperCase().replace(/[\s_-]/g, '') || upperK.includes(m.toUpperCase().replace(/[\s_-]/g, '')))) {
          count += Number(v) || 0
          foundInBackend = true
        }
      })

      if (foundInBackend) return count

      return myDirectLeads.filter((l) => {
        const stageUpper = (l.stage || '').toUpperCase().replace(/[\s_-]/g, '')
        return matchKeys.some((m) => stageUpper === m.toUpperCase().replace(/[\s_-]/g, '') || stageUpper.includes(m.toUpperCase().replace(/[\s_-]/g, '')))
      }).length
    }

    return [
      {
        key: 'New',
        label: 'New',
        count: getCount(['NEW', 'FRESH', 'UNASSIGNED', 'NEWINQUIRY']),
        borderClass: 'border-sky-200 hover:border-sky-400 bg-sky-50/50 hover:bg-sky-50',
        badgeClass: 'text-sky-700 bg-sky-100/70',
        textClass: 'text-sky-950',
        barClass: 'bg-sky-500',
      },
      {
        key: 'Contacted',
        label: 'Contacted',
        count: getCount(['CONTACTED', 'CONTACT', 'CALL', 'REACHED']),
        borderClass: 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/50 hover:bg-indigo-50',
        badgeClass: 'text-indigo-700 bg-indigo-100/70',
        textClass: 'text-indigo-950',
        barClass: 'bg-indigo-500',
      },
      {
        key: 'Follow Up',
        label: 'Follow Up',
        count: getCount(['FOLLOWUP', 'FOLLOW', 'NEGOTIATION', 'INPROGRESS']),
        borderClass: 'border-purple-200 hover:border-purple-400 bg-purple-50/50 hover:bg-purple-50',
        badgeClass: 'text-purple-700 bg-purple-100/70',
        textClass: 'text-purple-950',
        barClass: 'bg-purple-500',
      },
      {
        key: 'Interested',
        label: 'Interested',
        count: getCount(['INTERESTED', 'SITEVISIT', 'VISIT', 'QUALIFIED']),
        borderClass: 'border-amber-200 hover:border-amber-400 bg-amber-50/50 hover:bg-amber-50',
        badgeClass: 'text-amber-700 bg-amber-100/70',
        textClass: 'text-amber-950',
        barClass: 'bg-amber-500',
      },
      {
        key: 'Converted',
        label: 'Converted',
        count: getCount(['CONVERTED', 'BOOKED', 'WON', 'CLOSED']),
        borderClass: 'border-emerald-300 hover:border-emerald-500 bg-emerald-50/60 hover:bg-emerald-50',
        badgeClass: 'text-emerald-800 bg-emerald-100',
        textClass: 'text-emerald-950',
        barClass: 'bg-emerald-600',
      },
      {
        key: 'Lost',
        label: 'Lost',
        count: getCount(['LOST', 'REJECTED', 'DROPPED', 'CANCELLED']),
        borderClass: 'border-rose-200 hover:border-rose-400 bg-rose-50/40 hover:bg-rose-50',
        badgeClass: 'text-rose-700 bg-rose-100/70',
        textClass: 'text-rose-950',
        barClass: 'bg-rose-500',
      },
    ]
  }, [dashboardData, myDirectLeads])

  // Filter projects if a project is selected
  const filteredProjects = selectedProject && selectedProject !== 'ALL'
    ? projects.filter((p) => p.name.toLowerCase().includes(selectedProject.toLowerCase()))
    : projects

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6 text-slate-900 animate-in fade-in duration-200">
      {/* 1. TOP BACKEND KPI CARDS (2 CARDS PER ROW ON MOBILE) */}
      <div
        className={cn(
          'grid grid-cols-2 gap-3 sm:gap-4',
          isCpHead
            ? showTeamLeadsCard
              ? 'lg:grid-cols-4'
              : 'lg:grid-cols-3'
            : ''
        )}
      >
        {/* 1. Projects */}
        <Card
          onClick={() => onNavigateTab && onNavigateTab('projects')}
          className="border border-slate-200 shadow-xs bg-white rounded-2xl p-3.5 sm:p-5 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Projects</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5 sm:mt-1">{projectsCount}</h3>
              <p className="text-[10px] sm:text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1 group-hover:underline truncate">
                <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" /> <span className="truncate">Active on Portal</span>
              </p>
            </div>
            <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-[#0092b3]/10 text-[#0092b3] flex items-center justify-center font-bold group-hover:bg-[#0092b3] group-hover:text-white transition-colors shrink-0">
              <Building2 className="h-4.5 w-4.5 sm:h-6 sm:w-6" />
            </div>
          </div>
        </Card>

        {/* 2. Team Size (Only for CP Head) */}
        {isCpHead && (
          <Card
            onClick={() => onNavigateTab && onNavigateTab('team')}
            className="border border-slate-200 shadow-xs bg-white rounded-2xl p-3.5 sm:p-5 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Team Size</p>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5 sm:mt-1">{teamCount}</h3>
                <p className="text-[10px] sm:text-[11px] font-semibold text-[#0092b3] mt-1 flex items-center gap-1 group-hover:underline truncate">
                  <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" /> <span className="truncate">Team Network</span>
                </p>
              </div>
              <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-[#0092b3]/10 text-[#0092b3] flex items-center justify-center font-bold group-hover:bg-[#0092b3] group-hover:text-white transition-colors shrink-0">
                <Users className="h-4.5 w-4.5 sm:h-6 sm:w-6" />
              </div>
            </div>
          </Card>
        )}

        {/* 3. My Leads */}
        <Card
          onClick={() => onNavigateTab && onNavigateTab('myleads')}
          className="border border-slate-200 shadow-xs bg-white rounded-2xl p-3.5 sm:p-5 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">My Leads</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5 sm:mt-1">{totalLeadsCount}</h3>
              <p className="text-[10px] sm:text-[11px] font-semibold text-[#0092b3] mt-1 flex items-center gap-1 group-hover:underline truncate">
                <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" /> <span className="truncate">Direct Leads</span>
              </p>
            </div>
            <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-[#0092b3]/10 text-[#0092b3] flex items-center justify-center font-bold group-hover:bg-[#0092b3] group-hover:text-white transition-colors shrink-0">
              <TrendingUp className="h-4.5 w-4.5 sm:h-6 sm:w-6" />
            </div>
          </div>
        </Card>

        {/* 4. Team Leads (Only for CP Head / accounts with downlines) */}
        {showTeamLeadsCard && (
          <Card
            onClick={() => onNavigateTab && onNavigateTab('leads')}
            className="border border-slate-200 shadow-xs bg-white rounded-2xl p-3.5 sm:p-5 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Team Leads</p>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5 sm:mt-1">{teamLeadsCount}</h3>
                <p className="text-[10px] sm:text-[11px] font-semibold text-[#0092b3] mt-1 flex items-center gap-1 group-hover:underline truncate">
                  <UserCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" /> <span className="truncate">Network Leads</span>
                </p>
              </div>
              <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-cyan-50 text-[#0092b3] flex items-center justify-center font-bold group-hover:bg-[#0092b3] group-hover:text-white transition-colors shrink-0">
                <UserCheck className="h-4.5 w-4.5 sm:h-6 sm:w-6" />
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* 2. LIVE BACKEND STATUS STATS (6 STATUSES: New, Contacted, Follow Up, Interested, Converted, Lost) */}
      <Card className="border border-slate-200 shadow-xs bg-white rounded-2xl overflow-hidden">
        <CardHeader className="py-3.5 px-5 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#0092b3]" />
            <CardTitle className="text-sm font-black text-slate-900">
              Lead Status Breakdown
            </CardTitle>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onNavigateTab && onNavigateTab('myleads')}
            className="text-xs font-bold text-[#0092b3] hover:text-[#007d99] hover:bg-[#0092b3]/10 h-7.5 px-2.5 rounded-lg gap-1 cursor-pointer"
          >
            <span>View My Leads</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {statusStats.map((item) => {
              const pct = totalLeadsCount > 0 ? Math.round((item.count / totalLeadsCount) * 100) : 0
              return (
                <div
                  key={item.key}
                  onClick={() => onNavigateTab && onNavigateTab('myleads')}
                  className={cn(
                    'p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 shadow-2xs hover:shadow-sm',
                    item.borderClass
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn('text-[11px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider', item.badgeClass)}>
                      {item.label}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">{pct}%</span>
                  </div>

                  <p className={cn('text-2xl font-black', item.textClass)}>
                    {item.count}
                  </p>

                  <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', item.barClass)}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 3. TEAM CHANNEL PARTNER CARDS (ONLY FOR CHANNEL HEAD) */}
      {isCpHead && (
        <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden rounded-2xl animate-in fade-in duration-300">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 pt-4 px-5 border-b border-slate-100 gap-2">
            <div>
              <CardTitle className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-[#0092b3]" />
                <span>Team Channel Partners</span>
              </CardTitle>
              <CardDescription className="text-xs font-semibold text-slate-500 mt-0.5">
                Channel partners in your downline network. Click any card to view their sourced leads.
              </CardDescription>
            </div>
            <span className="text-xs font-black text-[#0092b3] bg-[#0092b3]/10 px-3 py-1.5 rounded-xl border border-[#0092b3]/20 self-start sm:self-auto">
              {teamPartners.length} {teamPartners.length === 1 ? 'Partner' : 'Partners'} in Network
            </span>
          </CardHeader>

          <CardContent className="p-4 sm:p-5">
            {teamPartners.length === 0 ? (
              <div className="py-10 text-center text-slate-400 font-medium text-xs">
                No team partners registered under your code yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {teamPartners.map((partner) => {
                  const initials =
                    partner.name
                      .split(' ')
                      .map((n) => n[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || 'CP'
                  const hasPhone = partner.mobile && partner.mobile !== '-'
                  const hasEmail = partner.email && partner.email !== '-'

                  return (
                    <div
                      key={partner.id}
                      onClick={() => {
                        if (onNavigateTab) {
                          onNavigateTab('leads', undefined, { id: partner.id, name: partner.name })
                        }
                      }}
                      className="p-4.5 rounded-2xl border border-slate-200/90 bg-white hover:border-[#0092b3] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4 hover:-translate-y-0.5"
                    >
                      {/* Top row: Avatar + Name + Status */}
                      <div className="flex items-start gap-3">
                        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#0092b3] to-cyan-600 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-sm font-black text-slate-900 truncate group-hover:text-[#0092b3] transition-colors">
                              {partner.name}
                            </h4>
                            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                              Active
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">
                            {partner.company}
                          </p>
                          <span className="inline-block text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md mt-1 font-mono">
                            {partner.code}
                          </span>
                        </div>
                      </div>

                      {/* Middle row: Contact details (Phone / Email) */}
                      {(hasPhone || hasEmail) && (
                        <div className="space-y-1 text-xs border-t border-slate-100 pt-2.5">
                          {hasPhone && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-700">
                              <Phone className="h-3 w-3 text-[#0092b3] shrink-0" />
                              <span className="font-semibold">{partner.mobile}</span>
                            </div>
                          )}
                          {hasEmail && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                              <Mail className="h-3 w-3 text-[#0092b3] shrink-0" />
                              <span className="truncate">{partner.email}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bottom row: Leads Count Badge + View Leads Action */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700">
                          <TrendingUp className="h-3.5 w-3.5 text-[#0092b3]" />
                          <span>
                            <strong className="text-sm font-black text-[#0092b3]">{partner.leadsCount}</strong> {partner.leadsCount === 1 ? 'Lead' : 'Leads'}
                          </span>
                        </div>

                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#0092b3] group-hover:translate-x-0.5 transition-transform">
                          <span>View Leads</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* PROJECT DETAILS SPECIFICATIONS MODAL */}
      <ProjectDetailsModal
        project={selectedProjectForModal}
        leads={leads}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false)
          setSelectedProjectForModal(null)
        }}
        onOpenAddLead={onOpenAddLead}
      />
    </div>
  )
}

export default OverviewTab
