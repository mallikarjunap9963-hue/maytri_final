import React, { useState, useEffect, useMemo } from 'react'
import {
  Building2,
  Users,
  RefreshCw,
  Info,
  MapPin,
  TrendingUp,
  ShieldCheck,
  Home,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ApiService } from '@/services/apiService'
import { TableDataSkeleton } from '@/components/common/Skeletons'
import { ProjectDetailsModal } from '@/components/modals/ProjectDetailsModal'
import type { Project, Lead } from '@/data/appData'
import { DEFAULT_PROJECTS } from '@/data/appData'
import { cn } from '@/lib/utils'

interface ProjectsTabProps {
  onNavigateTab?: (tab: any, projectName?: string) => void
  onOpenAddLead: (projectName?: string) => void
  refreshKey?: number
}

// Fallback high quality architectural photography for projects without thumbnail
const PROJECT_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
]

// Strict helper to match lead with project
const isLeadForProject = (l: Lead, p: Project): boolean => {
  if (!l || !p) return false

  // 1. Direct Project ID match (numeric or string)
  const pId = p.rawId !== undefined && p.rawId !== null ? String(p.rawId) : String(p.id || '').trim()
  const lProjId = (l as any).project_id !== undefined && (l as any).project_id !== null
    ? String((l as any).project_id)
    : (l as any).projectId !== undefined && (l as any).projectId !== null
      ? String((l as any).projectId)
      : ''

  if (pId && lProjId && pId === lProjId) {
    return true
  }

  // 2. Project code match (e.g. MAY-101)
  const pCode = (p.projectCode || '').toLowerCase().trim()
  const lCode = ((l as any).project_code || '').toLowerCase().trim()
  if (pCode && lCode && pCode === lCode) {
    return true
  }

  // 3. Exact or precise title match (avoid empty or generic false-positive substrings)
  const projName = (p.name || '').toLowerCase().trim()
  const leadProj = (l.project || (l as any).project_name || '').toLowerCase().trim()
  if (projName && leadProj) {
    if (leadProj === projName) return true
    if (projName.length >= 5 && (leadProj.startsWith(projName) || projName.startsWith(leadProj))) {
      return true
    }
  }

  return false
}

export const ProjectsTab: React.FC<ProjectsTabProps> = ({
  onNavigateTab,
  onOpenAddLead,
  refreshKey,
}) => {
  const [projects, setProjects] = useState<Project[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [projectStatsMap, setProjectStatsMap] = useState<Map<number | string, number>>(new Map())
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL')

  // Modal States
  const [selectedProjectForModal, setSelectedProjectForModal] = useState<Project | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false)

  const loadData = async (isManual = false) => {
    if (isManual) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const [fetchedProjects, fetchedLeads, dashRes] = await Promise.all([
        ApiService.getProjects().catch(() => []),
        ApiService.getLeads().catch(() => []),
        ApiService.getLeadsDashboard().catch(() => null),
      ])

      const statsMap = new Map<number | string, number>()
      if (dashRes?.ok && dashRes.data) {
        const myProjs = dashRes.data.my_leads?.projects || []
        const partnerProjs = dashRes.data.partner_leads?.projects || []

        for (const item of [...myProjs, ...partnerProjs]) {
          if (item?.project?.id) {
            const current = statsMap.get(item.project.id) || 0
            statsMap.set(item.project.id, Math.max(current, item.total || 0))
          }
          if (item?.project?.project_code) {
            const current = statsMap.get(item.project.project_code) || 0
            statsMap.set(item.project.project_code, Math.max(current, item.total || 0))
          }
        }
      }

      setProjectStatsMap(statsMap)
      setProjects(fetchedProjects && fetchedProjects.length > 0 ? fetchedProjects : DEFAULT_PROJECTS)
      setLeads(fetchedLeads || [])
    } catch (err) {
      console.warn('Error loading projects data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [refreshKey])

  // Filter projects by status & search
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Status filter
      if (selectedStatusFilter !== 'ALL') {
        const rawStatus = (p.status || '').toUpperCase()
        if (selectedStatusFilter === 'ONGOING' && !rawStatus.includes('ONGO') && !rawStatus.includes('ACTIVE')) return false
        if (selectedStatusFilter === 'UPCOMING' && !rawStatus.includes('UPCOM') && !rawStatus.includes('PRE')) return false
        if (selectedStatusFilter === 'COMPLETED' && !rawStatus.includes('COMPLET') && !rawStatus.includes('READY')) return false
      }

      // Search filter
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase().trim()
      return (
        p.name.toLowerCase().includes(q) ||
        (p.location && p.location.toLowerCase().includes(q)) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        (p.type && p.type.toLowerCase().includes(q)) ||
        (p.projectCode && p.projectCode.toLowerCase().includes(q))
      )
    })
  }, [projects, selectedStatusFilter, searchQuery])

  const ongoingCount = projects.filter((p) => (p.status || '').toUpperCase().includes('ONGO') || (p.status || '').toUpperCase().includes('ACTIVE')).length
  const upcomingCount = projects.filter((p) => (p.status || '').toUpperCase().includes('UPCOM') || (p.status || '').toUpperCase().includes('PRE')).length
  const completedCount = projects.filter((p) => (p.status || '').toUpperCase().includes('COMPLET') || (p.status || '').toUpperCase().includes('READY')).length

  if (loading) {
    return <TableDataSkeleton />
  }

  return (
    <div className="space-y-6 text-slate-900 animate-in fade-in duration-200">
      {/* FILTER TABS & SEARCH CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { key: 'ALL', label: 'All Projects', count: projects.length },
            { key: 'ONGOING', label: 'Ongoing', count: ongoingCount },
            { key: 'UPCOMING', label: 'Upcoming', count: upcomingCount },
            { key: 'COMPLETED', label: 'Completed', count: completedCount },
          ].map((tab) => {
            const isActive = selectedStatusFilter === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedStatusFilter(tab.key)}
                className={cn(
                  'px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-2',
                  isActive
                    ? 'bg-[#0092b3] text-white shadow-xs font-extrabold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-md text-[10px] font-black',
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-700'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Refresh Action */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => loadData(true)}
            variant="outline"
            size="sm"
            className="h-9 border-slate-200 text-slate-700 hover:text-[#0092b3] hover:bg-slate-50 font-bold text-xs gap-1.5 rounded-xl px-3 cursor-pointer shadow-2xs shrink-0"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 text-[#0092b3]', refreshing && 'animate-spin')} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* 3. PREMIUM PROJECT CARDS GRID */}
      {filteredProjects.length === 0 ? (
        <div className="p-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200 shadow-2xs">
          <div className="h-14 w-14 rounded-2xl bg-cyan-50 text-[#0092b3] flex items-center justify-center mx-auto shadow-xs">
            <Building2 className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-900">No Projects Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
              No projects matched your search criteria. Try clearing the search or switching filter categories.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((p, idx) => {
            const pRawId = p.rawId !== undefined ? p.rawId : Number(p.id)
            const backendCount = (pRawId && projectStatsMap.has(pRawId))
              ? projectStatsMap.get(pRawId)!
              : (p.projectCode && projectStatsMap.has(p.projectCode))
                ? projectStatsMap.get(p.projectCode)!
                : null
            const projLeads = leads.filter((l) => isLeadForProject(l, p))
            const totalProjectLeadsCount = backendCount !== null ? backendCount : projLeads.length

            const rawStatus = (p.status || 'Ongoing').toUpperCase()
            const isOngoing = rawStatus.includes('ONGO') || rawStatus.includes('ACTIVE')
            const isUpcoming = rawStatus.includes('UPCOM') || rawStatus.includes('PRE')
            const isCompleted = rawStatus.includes('COMPLET') || rawStatus.includes('READY')

            const imageSrc =
              p.thumbnail ||
              p.image ||
              PROJECT_FALLBACK_IMAGES[idx % PROJECT_FALLBACK_IMAGES.length]

            return (
              <div
                key={p.id}
                className="group relative flex flex-col justify-between rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-[#0092b3]/50 transition-all duration-300 overflow-hidden hover:-translate-y-1"
              >
                {/* TOP IMAGE HERO SECTION */}
                <div className="relative h-52 w-full overflow-hidden bg-slate-100">
                  <img
                    src={imageSrc}
                    alt={p.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* Subtle Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                  {/* Top Status & Code Badges */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase shadow-md backdrop-blur-md',
                        isOngoing && 'bg-emerald-500/90 text-white',
                        isUpcoming && 'bg-amber-500/90 text-white',
                        isCompleted && 'bg-blue-600/90 text-white',
                        !isOngoing && !isUpcoming && !isCompleted && 'bg-[#0092b3]/90 text-white'
                      )}
                    >
                      {p.status || 'Ongoing'}
                    </span>

                    {p.projectCode && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-cyan-200 border border-white/20 font-mono">
                        {p.projectCode}
                      </span>
                    )}
                  </div>

                  {/* Bottom Image Info (Price & Units) */}
                  <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-end justify-between text-white">
                    <div>
                      {p.startingPrice && (
                        <p className="text-lg font-black text-white drop-shadow-sm">
                          {p.startingPrice} <span className="text-[10px] font-semibold text-slate-200">onwards</span>
                        </p>
                      )}
                      <p className="text-xs font-bold text-slate-200 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-[#2a94b5]" />
                        <span>{p.city || 'Hyderabad'}</span>
                      </p>
                    </div>

                    {/* Sourced Leads Chip */}
                    <div className="px-2.5 py-1 rounded-xl bg-white/20 backdrop-blur-md border border-white/25 text-right">
                      <p className="text-xs font-black text-white flex items-center gap-1 justify-end">
                        <TrendingUp className="h-3 w-3 text-cyan-300" />
                        <span>{totalProjectLeadsCount}</span>
                      </p>
                      <p className="text-[9px] font-extrabold text-cyan-200 uppercase">Leads</p>
                    </div>
                  </div>
                </div>

                {/* CARD BODY DETAILS */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    {/* Project Title */}
                    <div>
                      <h3 className="text-base font-black text-slate-900 group-hover:text-[#0092b3] transition-colors leading-tight">
                        {p.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 mt-1">
                        <MapPin className="h-3.5 w-3.5 text-[#0092b3] shrink-0" />
                        <span className="truncate">{p.location || 'Financial District, Hyderabad'}</span>
                      </p>
                    </div>

                    {/* Type / Configuration Pill */}
                    {p.type && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold">
                        <Home className="h-3 w-3 text-[#0092b3]" />
                        <span className="truncate">{p.type}</span>
                      </div>
                    )}

                    {/* Description excerpt */}
                    {p.description && (
                      <p className="text-xs text-slate-500 font-normal line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    )}

                    {/* Specs / RERA pills */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {p.reraNumber && (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <ShieldCheck className="h-3 w-3 text-emerald-600" />
                          <span>RERA: {p.reraNumber}</span>
                        </span>
                      )}
                      {p.totalUnits && (
                        <span className="text-[10.5px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {p.totalUnits} Units
                        </span>
                      )}
                    </div>
                  </div>

                  {/* BOTTOM ACTION BUTTONS - 2 BUTTONS ONLY */}
                  <div className="pt-3.5 border-t border-slate-100 grid grid-cols-2 gap-2.5">
                    {/* 1. View More (Project Details & Specs) */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProjectForModal(p)
                        setIsDetailsModalOpen(true)
                      }}
                      className="group/more inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200/70 hover:border-slate-300 transition-all duration-200 cursor-pointer shadow-2xs active:scale-[0.98]"
                    >
                      <Info className="h-3.5 w-3.5 text-[#0092b3] group-hover/more:scale-110 transition-transform" />
                      <span>View More</span>
                    </button>

                    {/* 2. View Leads (Filtered by project) */}
                    <button
                      type="button"
                      onClick={() => {
                        if (onNavigateTab) {
                          onNavigateTab('leads', p.name)
                        }
                      }}
                      className="group/leads inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-[#0092b3] to-[#007b99] hover:from-[#007b99] hover:to-[#005f78] shadow-xs hover:shadow-md hover:shadow-[#0092b3]/25 transition-all duration-200 cursor-pointer active:scale-[0.98]"
                    >
                      <Users className="h-3.5 w-3.5 text-white stroke-[2.5]" />
                      <span>View Leads</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
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
        onNavigateToLeads={(projName) => {
          setIsDetailsModalOpen(false)
          setSelectedProjectForModal(null)
          if (onNavigateTab) {
            onNavigateTab('leads', projName)
          }
        }}
      />
    </div>
  )
}

export default ProjectsTab
