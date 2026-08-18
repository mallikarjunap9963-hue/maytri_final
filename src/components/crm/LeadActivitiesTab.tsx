import React, { useState, useEffect } from 'react'
import {
  Activity,
  Download,
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
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ApiService } from '@/services/apiService'
import { TableDataSkeleton } from '@/components/common/Skeletons'

export interface LeadActivity {
  id: string
  name: string
  email: string
  phone: string
  sellDoLeadId: string
  project: string
  channelPartner: string
  leadStage: 'New Inquiry' | 'Site Visit Scheduled' | 'Token / Negotiation' | 'Loan Processing' | 'Booked' | 'Lost' | string
  leadStatus: 'Active' | 'Under Review' | 'Converted' | 'Expired'
  registeredAt: string
  validityPeriod: string
}

export const LeadActivitiesTab: React.FC = () => {
  const [activities, setActivities] = useState<LeadActivity[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false)
  const [selectedLeadId, setSelectedLeadId] = useState<number>(1)
  const [activityType, setActivityType] = useState('Call Note')
  const [noteDesc, setNoteDesc] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load leads from backend
  useEffect(() => {
    async function loadBackendLeads() {
      setLoading(true)
      try {
        const res = await ApiService.getLeads()
        if (res && res.length > 0) {
          const mapped: LeadActivity[] = res.map((l) => ({
            id: `act-api-${l.id}`,
            name: l.name,
            email: l.email || '-',
            phone: l.phone || '-',
            sellDoLeadId: String(l.rawId ? `LD-${l.rawId}` : l.id),
            project: l.project || '-',
            channelPartner: l.assignedTo || l.source || 'Channel Partner',
            leadStage: l.stage,
            leadStatus: l.stage === 'Booked' ? 'Converted' : l.stage === 'Lost' ? 'Expired' : 'Active',
            registeredAt: l.createdDate || '-',
            validityPeriod: l.lastActivity || '-',
          }))
          setActivities(mapped)
        } else {
          setActivities([])
        }
      } catch (err) {
        console.warn('Leads query:', err)
      } finally {
        setLoading(false)
      }
    }
    loadBackendLeads()
  }, [])

  const handleDeleteActivity = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete lead activity for "${name}"?`)) {
      setActivities((prev) => prev.filter((a) => a.id !== id))
    }
  }

  const handleEditActivity = (activity: LeadActivity) => {
    const newName = prompt('Edit Lead Name:', activity.name)
    if (newName && newName.trim() !== '') {
      setActivities((prev) =>
        prev.map((a) => (a.id === activity.id ? { ...a, name: newName.trim() } : a))
      )
    }
  }

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteDesc) return
    setIsSubmitting(true)
    try {
      await ApiService.addLeadNote(selectedLeadId, {
        activity_type: activityType,
        description: noteDesc,
      })
      alert(`Activity "${activityType}" posted to live backend API!`)
      setIsAddNoteOpen(false)
      setNoteDesc('')
    } catch {
      setIsAddNoteOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
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
          {/* Total Count Badge */}
          <div className="border border-[#0092b3]/40 bg-[#0092b3]/10 text-[#0092b3] font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">
            <span>Total :</span>
            <span className="font-extrabold">{activities.length}</span>
          </div>

          {/* Add Activity Note Button */}
          <Button
            size="sm"
            className="bg-[#0092b3] hover:bg-[#007d99] text-white font-bold text-xs h-8.5 px-3 rounded-lg gap-1.5 shadow-sm cursor-pointer"
            onClick={() => setIsAddNoteOpen(true)}
          >
            <MessageSquarePlus className="h-4 w-4" />
            <span>Log Activity Note</span>
          </Button>

          {/* Exports Dropdown */}
          <Button
            variant="outline"
            size="sm"
            className="border border-[#0092b3]/50 text-[#0092b3] hover:bg-[#0092b3]/10 font-bold text-xs h-8.5 px-3 rounded-lg gap-1.5 cursor-pointer"
            onClick={() => alert('Exporting Lead Activities CSV/Excel report...')}
          >
            <span>Exports</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>

          {/* Filter Button */}
          <Button
            variant="outline"
            size="sm"
            className="border border-[#0092b3]/50 text-[#0092b3] hover:bg-[#0092b3]/10 h-8.5 w-8.5 p-0 rounded-lg flex items-center justify-center cursor-pointer"
          >
            <Filter className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Lead Activities Table Card */}
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden rounded-xl">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-[#0092b3] text-white font-medium text-xs tracking-wide">
                <th className="py-3 px-5 min-w-[240px] font-medium">Name/Email/Phone</th>
                <th className="py-3 px-3 text-center font-medium">Sell Do Lead ID</th>
                <th className="py-3 px-3 text-center font-medium">Project</th>
                <th className="py-3 px-4 text-center font-medium">Channel Partner</th>
                <th className="py-3 px-3 text-center font-medium">Lead Stage</th>
                <th className="py-3 px-3 text-center font-medium">Lead Status</th>
                <th className="py-3 px-3 text-center font-medium">Registered At</th>
                <th className="py-3 px-3 text-center font-medium">Lead validity period</th>
                <th className="py-3 px-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium text-xs">
                    No lead activities recorded. Click "Log Activity Note" above to log a new activity.
                  </td>
                </tr>
              ) : (
                activities.map((act, idx) => (
                <tr
                  key={act.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                  }`}
                >
                  {/* Name/Email/Phone */}
                  <td className="py-3.5 px-5 space-y-0.5">
                    <h4 className="font-semibold text-xs text-[#0092b3] hover:underline cursor-pointer">
                      {act.name}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-normal">
                      <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>{act.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-normal">
                      <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>{act.phone}</span>
                    </div>
                  </td>

                  {/* Sell Do Lead ID */}
                  <td className="py-3.5 px-3 text-center font-normal text-slate-700 font-mono">
                    {act.sellDoLeadId}
                  </td>

                  {/* Project */}
                  <td className="py-3.5 px-3 text-center font-normal text-slate-900">
                    {act.project}
                  </td>

                  {/* Channel Partner */}
                  <td className="py-3.5 px-4 text-center font-normal text-slate-800">
                    {act.channelPartner}
                  </td>

                  {/* Lead Stage */}
                  <td className="py-3.5 px-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#0092b3]/15 text-[#0092b3]">
                      {act.leadStage}
                    </span>
                  </td>

                  {/* Lead Status */}
                  <td className="py-3.5 px-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800">
                      {act.leadStatus}
                    </span>
                  </td>

                  {/* Registered At */}
                  <td className="py-3.5 px-3 text-center text-slate-600 font-normal">
                    {act.registeredAt}
                  </td>

                  {/* Lead validity period */}
                  <td className="py-3.5 px-3 text-center font-bold text-amber-700">
                    {act.validityPeriod}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        title="Edit Lead Activity"
                        className="p-1.5 text-slate-600 hover:text-[#0092b3] hover:bg-[#0092b3]/10 rounded-lg transition-colors cursor-pointer"
                        onClick={() => handleEditActivity(act)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      <button
                        title="Delete Lead Activity"
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        onClick={() => handleDeleteActivity(act.id, act.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )))}
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
                  Saves note directly to backend lead timeline
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleAddNoteSubmit} className="space-y-3 text-xs text-slate-800 pt-1">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Select Customer Lead</label>
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(Number(e.target.value))}
                className="w-full h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold"
              >
                {activities.map((a, idx) => (
                  <option key={a.id} value={idx + 1}>
                    {a.name} ({a.project})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Activity Type</label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold"
              >
                <option value="Phone Call Log">Phone Call Log</option>
                <option value="WhatsApp Conversation">WhatsApp Conversation</option>
                <option value="Site Visit Follow-up">Site Visit Follow-up</option>
                <option value="Price Quotation Shared">Price Quotation Shared</option>
                <option value="Loan Eligibility Check">Loan Eligibility Check</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Activity Description / Summary *</label>
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
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Posting...
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
