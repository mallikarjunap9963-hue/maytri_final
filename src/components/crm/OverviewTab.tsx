import React, { useState, useEffect } from 'react'
import {
  Building2,
  Users,
  TrendingUp,
  Plus,
  RefreshCw,
  MapPin,
  CheckCircle2,
  Info,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ApiService, AuthToken } from '@/services/apiService'
import { MiniLoader } from '@/components/common/MiniLoader'
import { DashboardSkeleton } from '@/components/common/Skeletons'
import { ProjectDetailsModal } from '@/components/modals/ProjectDetailsModal'
import type { Project, Lead } from '@/data/appData'
import { DEFAULT_PROJECTS } from '@/data/appData'

interface OverviewTabProps {
  onNavigateTab?: (tab: any, projectName?: string) => void
  onOpenAddLead: (projectName?: string) => void
  onOpenScheduleVisit?: () => void
  selectedProject?: string
  refreshKey?: number
}

// Strict helper to match lead with project
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

export const OverviewTab: React.FC<OverviewTabProps> = ({
  onNavigateTab,
  onOpenAddLead,
  onOpenScheduleVisit,
  selectedProject,
  refreshKey,
}) => {
  const [loading, setLoading] = useState<boolean>(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [teamCount, setTeamCount] = useState<number>(0)

  // Modal States
  const [selectedProjectForModal, setSelectedProjectForModal] = useState<Project | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [fetchedProjects, fetchedLeads, profileRes, teamRes, treeRes] = await Promise.all([
        ApiService.getProjects().catch(() => []),
        ApiService.getLeads().catch(() => []),
        ApiService.getPartnerProfile().catch(() => null),
        ApiService.getMyTeam().catch(() => null),
        ApiService.getPartnerTree().catch(() => null),
      ])
      setProjects(fetchedProjects && fetchedProjects.length > 0 ? fetchedProjects : DEFAULT_PROJECTS)
      setLeads(fetchedLeads || [])

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
      const isCpHead =
        rawType.toUpperCase() === 'CP_HEAD' ||
        rawType.toUpperCase().includes('HEAD')

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

      if (isCpHead) {
        let count = 0
        if (teamRes?.ok && teamRes.data) {
          const rawItems =
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
          if (Array.isArray(rawItems)) {
            count = rawItems.filter((m: any) => isApprovedAccount(m)).length
          }
        }
        if (count === 0 && treeRes?.ok && treeRes.data) {
          const treeData = treeRes.data.data || treeRes.data.tree || treeRes.data.items || treeRes.data
          const treeList = Array.isArray(treeData) ? treeData : [treeData]
          let extracted = 0
          treeList.forEach((root: any) => {
            if (root && Array.isArray(root.children)) {
              extracted += root.children.filter((c: any) => isApprovedAccount(c)).length
            }
          })
          count = extracted
        }
        setTeamCount(count)
      } else {
        const isApproved = isApprovedAccount(profile) || profile?.is_approved === true || profile?.is_active !== false
        setTeamCount(isApproved ? 1 : 0)
      }
    } catch (err) {
      console.warn('Error loading overview data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [refreshKey])

  // Filter projects if a project is selected
  const filteredProjects = selectedProject && selectedProject !== 'ALL'
    ? projects.filter((p) => p.name.toLowerCase().includes(selectedProject.toLowerCase()))
    : projects

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6 text-slate-900">
      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border border-slate-200 shadow-xs bg-white rounded-2xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Portfolio Projects</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{projects.length}</h3>
              <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> All Active on Portal
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#0092b3]/10 text-[#0092b3] flex items-center justify-center font-bold">
              <Building2 className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="border border-slate-200 shadow-xs bg-white rounded-2xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Leads Sourced</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{leads.length}</h3>
              <p className="text-[11px] font-semibold text-[#0092b3] mt-1 flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> Real-time Sync
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#0092b3]/10 text-[#0092b3] flex items-center justify-center font-bold">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card
          onClick={() => onNavigateTab && onNavigateTab('team')}
          className="border border-slate-200 shadow-xs bg-white rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">My Team</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{teamCount}</h3>
              <p className="text-[11px] font-semibold text-[#0092b3] mt-1 flex items-center gap-1 group-hover:underline">
                <Users className="h-3.5 w-3.5" /> View Team Network
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#0092b3]/10 text-[#0092b3] flex items-center justify-center font-bold group-hover:bg-[#0092b3] group-hover:text-white transition-colors">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* CHANNEL PARTNER PERFORMANCE TABLE (PROJECTS & LEADS) */}
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden rounded-2xl">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 pt-4 px-5 border-b border-slate-100 gap-2">
          <div>
            <CardTitle className="text-base font-extrabold text-slate-900 tracking-tight">
              Channel Partner Performance
            </CardTitle>
            <CardDescription className="text-xs font-semibold text-slate-500 mt-0.5">
              Live projects portfolio, specifications, and assigned lead counts
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={loadData}
              variant="outline"
              size="sm"
              className="h-8.5 border-slate-200 text-slate-700 hover:text-[#0092b3] hover:bg-slate-50 font-bold text-xs gap-1.5 rounded-xl px-3 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#0092b3]" />
              <span>Refresh</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0092b3] text-white font-semibold text-[11px] tracking-wide">
                <th className="py-3.5 px-6 font-bold border-r border-cyan-400/30">Project</th>
                <th className="py-3.5 px-6 text-center font-bold w-52">Leads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-12 text-center text-slate-400 font-medium text-xs">
                    No active projects found. Projects registered in backend will appear here automatically.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p, idx) => {
                  // Strictly count leads for this specific project only
                  const projLeads = leads.filter((l) => isLeadForProject(l, p))

                  return (
                    <tr
                      key={p.id}
                      className={cn(
                        'hover:bg-[#0092b3]/5 transition-colors',
                        idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                      )}
                    >
                      <td className="py-4 px-6 border-r border-slate-100">
                        <div className="flex items-start gap-3.5">
                          <div className="h-10 w-10 rounded-2xl bg-[#0092b3]/10 text-[#0092b3] flex items-center justify-center font-bold shrink-0 mt-0.5 shadow-xs">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span className="text-sm font-black text-slate-900">{p.name}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProjectForModal(p)
                                  setIsDetailsModalOpen(true)
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-extrabold text-[#0092b3] hover:text-[#007d99] bg-[#0092b3]/10 hover:bg-[#0092b3]/20 rounded-lg border border-[#0092b3]/20 transition-all cursor-pointer shadow-2xs"
                              >
                                <Info className="h-3 w-3 text-[#0092b3]" />
                                <span>View More</span>
                              </button>
                            </div>
                            {p.description ? (
                              <p className="text-xs text-slate-500 font-medium line-clamp-2 max-w-2xl leading-relaxed">
                                {p.description}
                              </p>
                            ) : (
                              <p className="text-xs text-slate-400 font-normal italic">
                                {p.location ? `Located at ${p.location}` : 'No description provided.'}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center font-black text-slate-900">
                        <div className="flex items-center justify-center gap-2">
                          <span className="inline-flex items-center justify-center min-w-[2.25rem] px-3 py-1 rounded-full bg-[#0092b3]/10 text-[#0092b3] font-black text-sm">
                            {projLeads.length}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (onNavigateTab) {
                                onNavigateTab('leads', p.name)
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-extrabold text-[#0092b3] hover:text-white bg-[#0092b3]/10 hover:bg-[#0092b3] rounded-lg border border-[#0092b3]/20 transition-all cursor-pointer shadow-2xs"
                          >
                            <Users className="h-3 w-3" />
                            <span>View Leads</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

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
