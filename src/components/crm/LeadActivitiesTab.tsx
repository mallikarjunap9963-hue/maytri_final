import React, { useState, useEffect } from 'react'
import {
  Activity,
  Filter,
  Mail,
  Phone,
  Edit3,
  Trash2,
  ChevronDown,
  Clock,
  Key,
  Plus,
  MessageSquarePlus,
  RefreshCw,
  UserCheck,
  Building2,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ApiService } from '@/services/apiService'
import type { BackendLeadActivity } from '@/services/apiService'
import type { Lead } from '@/data/appData'
import { TableDataSkeleton } from '@/components/common/Skeletons'
import { toast } from '@/components/common/ToastNotification'

export const LeadActivitiesTab: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null)
  const [activities, setActivities] = useState<BackendLeadActivity[]>([])
  const [loadingLeads, setLoadingLeads] = useState<boolean>(true)
  const [loadingActivities, setLoadingActivities] = useState<boolean>(false)

  // Add Note Modal
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false)
  const [modalLeadId, setModalLeadId] = useState<number | null>(null)
  const [activityType, setActivityType] = useState('Call Note')
  const [noteDesc, setNoteDesc] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 1. Fetch live leads list from backend
  useEffect(() => {
    async function loadLeads() {
      setLoadingLeads(true)
      try {
        const fetchedLeads = await ApiService.getLeads()
        setLeads(fetchedLeads || [])
        if (fetchedLeads && fetchedLeads.length > 0) {
          const firstLeadNumeric = fetchedLeads[0].rawId
            ? Number(fetchedLeads[0].rawId)
            : Number(fetchedLeads[0].id.replace(/\D/g, ''))
          if (firstLeadNumeric && !isNaN(firstLeadNumeric)) {
            setSelectedLeadId(firstLeadNumeric)
            setModalLeadId(firstLeadNumeric)
          }
        }
      } catch (err: any) {
        console.warn('Failed to load leads for activities:', err)
        toast.error('Failed to Load Leads', err.message || 'Could not load leads.')
      } finally {
        setLoadingLeads(false)
      }
    }
    loadLeads()
  }, [])

  // 2. Fetch real activities for the selected lead from backend
  const fetchActivities = async (leadNumericId: number) => {
    setLoadingActivities(true)
    try {
      const res = await ApiService.getLeadActivities(leadNumericId)
      if (res.ok && res.data?.items) {
        setActivities(res.data.items)
      } else {
        setActivities([])
      }
    } catch (err: any) {
      console.warn('Failed to load lead activities from backend:', err)
      setActivities([])
    } finally {
      setLoadingActivities(false)
    }
  }

  useEffect(() => {
    if (selectedLeadId) {
      fetchActivities(selectedLeadId)
    }
  }, [selectedLeadId])

  // Handle Add Note Submit (POST /api/leads/{id}/activities/)
  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetLeadId = modalLeadId || selectedLeadId
    if (!targetLeadId || !noteDesc.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const res = await ApiService.addLeadNote(targetLeadId, {
        activity_type: activityType,
        description: noteDesc.trim(),
      })

      if (!res.ok) {
        throw new Error(res.message || 'Could not save activity note to server database')
      }

      toast.success('Activity Logged', 'Activity note recorded to live database.')
      setIsAddNoteOpen(false)
      setNoteDesc('')
      if (selectedLeadId === targetLeadId) {
        await fetchActivities(targetLeadId)
      } else {
        setSelectedLeadId(targetLeadId)
      }
    } catch (err: any) {
      console.warn('Failed to add activity note:', err)
      toast.error('Add Note Failed', err.message || 'Could not save activity note.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUnsupportedAction = (action: string) => {
    toast.info('Feature Not Supported by Backend', `${action} of lead activities is not provided in backend Swagger API.`)
  }

  const selectedLead = leads.find((l) => {
    const num = l.rawId ? Number(l.rawId) : Number(l.id.replace(/\D/g, ''))
    return num === selectedLeadId
  })

  if (loadingLeads) {
    return <TableDataSkeleton rows={6} columns={6} />
  }

  return (
    <div className="space-y-5 text-slate-900 font-semibold font-sans">
      {/* Top Action Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-[#0092b3]" />
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Lead Activities
          </h1>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Lead Selector Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs shadow-2xs">
            <span className="text-slate-500 font-bold">Select Lead:</span>
            <select
              value={selectedLeadId || ''}
              onChange={(e) => {
                const id = Number(e.target.value)
                setSelectedLeadId(id)
                setModalLeadId(id)
              }}
              className="bg-transparent font-extrabold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              {leads.map((l) => {
                const numId = l.rawId ? Number(l.rawId) : Number(l.id.replace(/\D/g, ''))
                return (
                  <option key={l.id} value={numId}>
                    {l.name} ({l.project || 'Lead'})
                  </option>
                )
              })}
            </select>
          </div>

          {/* Total Count Badge */}
          <div className="border border-[#0092b3]/40 bg-[#0092b3]/10 text-[#0092b3] font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">
            <span>Activities :</span>
            <span className="font-extrabold">{activities.length}</span>
          </div>

          {/* Add Activity Note Button */}
          <Button
            size="sm"
            className="bg-[#0092b3] hover:bg-[#007d99] text-white font-bold text-xs h-8.5 px-3 rounded-lg gap-1.5 shadow-xs cursor-pointer"
            onClick={() => {
              setModalLeadId(selectedLeadId)
              setIsAddNoteOpen(true)
            }}
          >
            <MessageSquarePlus className="h-4 w-4" />
            <span>Log Activity Note</span>
          </Button>
        </div>
      </div>

      {/* Selected Lead Overview Bar */}
      {selectedLead && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-[#0092b3]/10 text-[#0092b3] flex items-center justify-center font-bold">
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900">{selectedLead.name}</div>
              <div className="text-slate-500 text-[11px] font-normal flex items-center gap-2">
                <span>{selectedLead.phone}</span>
                {selectedLead.email && <span>• {selectedLead.email}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-700">
            {selectedLead.project && (
              <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-bold text-[11px]">
                <Building2 className="h-3 w-3 text-[#0092b3]" />
                {selectedLead.project}
              </span>
            )}
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg font-bold text-[11px] bg-cyan-50 text-[#0092b3] border border-cyan-200">
              Stage: {selectedLead.stage}
            </span>
          </div>
        </div>
      )}

      {/* Real Lead Activities Table Card */}
      <Card className="border border-slate-200 shadow-xs bg-white overflow-hidden rounded-xl">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#0092b3] text-white font-medium text-xs tracking-wide">
                <th className="py-3 px-5 min-w-[80px]">Activity ID</th>
                <th className="py-3 px-4 min-w-[160px]">Activity Type</th>
                <th className="py-3 px-6 min-w-[280px]">Description / Notes</th>
                <th className="py-3 px-4 text-center min-w-[140px]">Status Transition</th>
                <th className="py-3 px-4 text-center min-w-[140px]">Logged By</th>
                <th className="py-3 px-4 text-center min-w-[160px]">Timestamp</th>
                <th className="py-3 px-3 text-center min-w-[90px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
              {loadingActivities ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-[#0092b3]" />
                    Loading backend activity timeline...
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium text-xs">
                    No activity notes recorded yet for this lead in the database. Click "Log Activity Note" above to record one.
                  </td>
                </tr>
              ) : (
                activities.map((act, idx) => (
                  <tr
                    key={act.id || idx}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                    }`}
                  >
                    {/* Activity ID */}
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-600">
                      #{act.id}
                    </td>

                    {/* Activity Type */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#0092b3]/15 text-[#0092b3]">
                        {act.activity_type || 'Note'}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-6 font-medium text-slate-800">
                      {act.description}
                    </td>

                    {/* Status Transition */}
                    <td className="py-3.5 px-4 text-center">
                      {act.old_status || act.new_status ? (
                        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600">
                          <span className="text-slate-500">{act.old_status || 'Start'}</span>
                          <span>→</span>
                          <span className="text-[#0092b3]">{act.new_status}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>

                    {/* Logged By */}
                    <td className="py-3.5 px-4 text-center text-slate-600 text-[11px]">
                      {act.performed_by
                        ? `${act.performed_by.first_name || ''} ${act.performed_by.last_name || ''}`.trim() || act.performed_by.email
                        : 'System'}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3.5 px-4 text-center text-slate-500 text-[11px]">
                      {act.created_at ? new Date(act.created_at).toLocaleString() : '-'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          title="Edit Activity (Not available in backend API)"
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          onClick={() => handleUnsupportedAction('Editing')}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          title="Delete Activity (Not available in backend API)"
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          onClick={() => handleUnsupportedAction('Deletion')}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* ADD ACTIVITY NOTE MODAL (POST /api/leads/{id}/activities/) */}
      <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
        <DialogContent className="sm:max-w-md bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#0092b3]/10 text-[#0092b3] flex items-center justify-center font-bold">
                <MessageSquarePlus className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Log Lead Activity Note
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Saves note directly to backend lead timeline via POST /api/leads/{'{id}'}/activities/
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleAddNoteSubmit} className="space-y-3 text-xs text-slate-800 pt-1">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Customer Lead *</label>
              <select
                value={modalLeadId || ''}
                onChange={(e) => setModalLeadId(Number(e.target.value))}
                className="w-full h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold"
                required
              >
                {leads.map((l) => {
                  const numId = l.rawId ? Number(l.rawId) : Number(l.id.replace(/\D/g, ''))
                  return (
                    <option key={l.id} value={numId}>
                      {l.name} — {l.project || 'Maytri Project'}
                    </option>
                  )
                })}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Activity Type *</label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold"
                required
              >
                <option value="Call Note">Call Note</option>
                <option value="Site Visit Note">Site Visit Note</option>
                <option value="Follow-up Note">Follow-up Note</option>
                <option value="Negotiation Note">Negotiation Note</option>
                <option value="WhatsApp Note">WhatsApp Note</option>
                <option value="General Note">General Note</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Description / Notes *</label>
              <textarea
                rows={3}
                placeholder="Spoke with customer regarding floor plan options and booked site visit for Sunday..."
                value={noteDesc}
                onChange={(e) => setNoteDesc(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs focus:ring-1 focus:ring-[#0092b3]"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddNoteOpen(false)}
                className="h-8.5 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-8.5 bg-[#0092b3] hover:bg-[#007d99] text-white text-xs font-bold gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  'Save Activity'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default LeadActivitiesTab
