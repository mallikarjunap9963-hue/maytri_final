import React, { useState, useEffect } from 'react'
import {
  Plus,
  Car,
  CheckCircle2,
  Clock,
  Phone,
  Building2,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { SiteVisit } from '@/data/appData'
import { ApiService } from '@/services/apiService'
import { MiniLoader } from '@/components/common/MiniLoader'

interface SiteVisitsTabProps {
  onOpenScheduleVisit: () => void
  selectedProject: string
}

export const SiteVisitsTab: React.FC<SiteVisitsTabProps> = ({
  onOpenScheduleVisit,
  selectedProject,
}) => {
  const [visits, setVisits] = useState<SiteVisit[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  useEffect(() => {
    let isMounted = true
    async function loadVisitsData() {
      setLoading(true)
      const data = await ApiService.getSiteVisits()
      if (isMounted) {
        setVisits(data)
        setLoading(false)
      }
    }
    loadVisitsData()
    return () => {
      isMounted = false
    }
  }, [])

  const filteredVisits = visits.filter((v) => {
    const matchesProject = selectedProject === 'ALL' || v.project === selectedProject
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter
    return matchesProject && matchesStatus
  })

  const handleUpdateStatus = (visitId: string, newStatus: SiteVisit['status']) => {
    setVisits((prev) =>
      prev.map((v) => (v.id === visitId ? { ...v, status: newStatus } : v))
    )
  }

  if (loading) {
    return <MiniLoader />
  }

  return (
    <div className="space-y-5 text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-slate-200 p-4 rounded-lg">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            Site Visit Appointments & Logistics
          </h2>
          <p className="text-xs text-slate-500 font-normal">
            Schedule site tours, arrange chauffeur cabs for buyers, and log feedback.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 cursor-pointer"
          >
            <option value="ALL">All Visit Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <Button onClick={onOpenScheduleVisit} variant="default" size="sm" className="gap-1.5 h-8 text-xs font-medium bg-[#2a94b5] hover:bg-[#237d99] text-white">
            <Plus className="h-3.5 w-3.5" /> Book New Visit
          </Button>
        </div>
      </div>

      {/* Visits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredVisits.map((visit) => {
          const isScheduled = visit.status === 'Scheduled'
          const isCompleted = visit.status === 'Completed'

          return (
            <Card
              key={visit.id}
              className="border-slate-200 bg-white transition-all hover:border-slate-300"
            >
              <CardHeader className="pb-2.5 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-medium text-[#2a94b5]">
                    {visit.id}
                  </span>
                  <Badge
                    variant={isCompleted ? 'success' : isScheduled ? 'default' : 'destructive'}
                    className="text-[9px] font-normal"
                  >
                    {visit.status}
                  </Badge>
                </div>
                <CardTitle className="text-sm font-semibold text-slate-900 mt-1">{visit.leadName}</CardTitle>
                <CardDescription className="flex items-center gap-1 text-xs text-slate-500 font-normal">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" /> {visit.project}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 pt-2.5 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 font-medium text-slate-700">
                    <Clock className="h-3.5 w-3.5 text-[#2a94b5]" /> {visit.date} at {visit.time}
                  </span>
                  <a
                    href={`tel:${visit.leadPhone}`}
                    className="text-[#2a94b5] hover:underline flex items-center gap-1 font-medium"
                  >
                    <Phone className="h-3 w-3" /> {visit.leadPhone}
                  </a>
                </div>

                <div className="rounded bg-slate-50 p-2 space-y-0.5 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-medium block uppercase">
                    Cab Requisition
                  </span>
                  {visit.cabRequired ? (
                    <span className="text-emerald-700 font-medium flex items-center gap-1 text-[11px]">
                      <Car className="h-3.5 w-3.5" /> Chauffeur Cab Confirmed
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[11px] font-normal">Self Transport</span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-medium block mb-0.5">
                    Notes
                  </span>
                  <p className="text-slate-600 font-normal italic bg-white p-2 rounded border border-slate-100 text-xs">
                    "{visit.notes}"
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-600">
                  <span className="text-[11px]">
                    Assigned: <strong className="text-slate-800 font-medium">{visit.salesExecutive}</strong>
                  </span>

                  {isScheduled && (
                    <Button
                      onClick={() => handleUpdateStatus(visit.id, 'Completed')}
                      size="sm"
                      variant="emerald"
                      className="h-6 text-[10px] px-2 gap-1 font-medium"
                    >
                      <CheckCircle2 className="h-3 w-3" /> Complete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
