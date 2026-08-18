import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Lead, Project } from '@/data/appData'
import {
  User,
  RefreshCw,
  Building,
  Phone,
  Mail,
  FileText,
} from 'lucide-react'
import { ApiService } from '@/services/apiService'
import { toast } from '@/components/common/ToastNotification'

interface AddLeadModalProps {
  isOpen: boolean
  onClose: () => void
  onAddLead: (lead: Lead) => void
  initialProjectName?: string
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({
  isOpen,
  onClose,
  onAddLead,
  initialProjectName,
}) => {
  // Schema fields
  const [customerName, setCustomerName] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('Hyderabad')
  const [projectId, setProjectId] = useState<number>(1)
  const [requirement, setRequirement] = useState('')

  const [projectList, setProjectList] = useState<Project[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function loadProjects() {
      const projs = await ApiService.getProjects()
      if (projs && projs.length > 0) {
        setProjectList(projs)
        let targetProj = projs[0]
        if (initialProjectName) {
          const match = projs.find(
            (p) => p.name.toLowerCase() === initialProjectName.toLowerCase()
          )
          if (match) targetProj = match
        }
        const numericId = Number(targetProj.id?.replace(/\D/g, '')) || Number(targetProj.rawId) || 1
        setProjectId(numericId)
      }
    }
    if (isOpen) {
      loadProjects()
    }
  }, [isOpen, initialProjectName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanName = customerName.trim()
    const cleanMobile = mobile.replace(/[^0-9]/g, '').slice(-10)

    if (!cleanName) {
      toast.warning('Required Field', 'Please enter Customer Name')
      return
    }
    if (!cleanMobile || cleanMobile.length < 10) {
      toast.warning('Invalid Mobile', 'Please enter a valid 10-digit mobile number')
      return
    }

    setIsSubmitting(true)

    try {
      const selectedProj = projectList.find(
        (p) => (Number(p.id?.replace(/\D/g, '')) || Number(p.rawId)) === projectId
      )

      const res = await ApiService.createLead({
        customer_name: cleanName,
        mobile: cleanMobile,
        email: email.trim() || undefined,
        city: city.trim() || 'Hyderabad',
        project_id: projectId,
        requirement: requirement.trim() || undefined,
        name: cleanName,
        phone: cleanMobile,
        project: selectedProj?.name || 'Maytri Project',
      })

      if (res.ok && res.data) {
        toast.success(
          'Lead Created Successfully!',
          `Prospective buyer "${cleanName}" has been recorded and assigned to ${selectedProj?.name || 'project'}.`
        )
        onAddLead(res.data)
        onClose()
        // Reset fields
        setCustomerName('')
        setMobile('')
        setEmail('')
        setCity('Hyderabad')
        setRequirement('')
      } else {
        const rawData = res.data as any
        const rawErr = res.error || (rawData && typeof rawData === 'object' ? (rawData.message || rawData.detail || JSON.stringify(rawData)) : null)
        const cleanErr = rawErr || 'Failed to create lead. Please verify all details.'
        toast.error('Failed to Create Lead', cleanErr)
      }
    } catch (err: any) {
      const errText = err?.message || 'Error submitting lead to server.'
      toast.error('Error', errText)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white text-slate-900 shadow-2xl rounded-3xl border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-slate-50/90 border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0092b3]/10 text-[#0092b3] font-bold shadow-xs">
              <User className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-extrabold text-slate-900">
                Add Customer Lead
              </DialogTitle>
            </div>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Customer Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-[#0092b3]" />
              <span>Customer Name</span>
              <span className="text-red-500 font-bold">*</span>
            </label>
            <Input
              placeholder="e.g. Ramesh Kumar"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="h-10 text-xs font-bold rounded-xl border-slate-300 focus-visible:border-[#0092b3]"
              required
            />
          </div>

          {/* Mobile Number & Email Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-[#0092b3]" />
                <span>Mobile Number</span>
                <span className="text-red-500 font-bold">*</span>
              </label>
              <Input
                placeholder="e.g. 9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                maxLength={15}
                className="h-10 text-xs font-bold rounded-xl border-slate-300 focus-visible:border-[#0092b3]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-[#0092b3]" />
                <span>Email Address</span>
              </label>
              <Input
                type="email"
                placeholder="e.g. ramesh@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 text-xs font-bold rounded-xl border-slate-300 focus-visible:border-[#0092b3]"
              />
            </div>
          </div>

          {/* Project Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-[#0092b3]" />
              <span>Project</span>
              <span className="text-red-500 font-bold">*</span>
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(Number(e.target.value))}
              className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0092b3] focus:ring-1 focus:ring-[#0092b3] shadow-2xs cursor-pointer"
            >
              {projectList.length === 0 ? (
                <option value={1}>Project 1</option>
              ) : (
                projectList.map((p) => {
                  const pid = Number(p.id?.replace(/\D/g, '')) || Number(p.rawId) || 1
                  return (
                    <option key={p.id} value={pid}>
                      {p.name}
                    </option>
                  )
                })
              )}
            </select>
          </div>

          {/* Customer Feedback */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-[#0092b3]" />
              <span>Customer Feedback</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Interested in 3 BHK, requested floor plan and pricing details..."
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0092b3] focus:ring-1 focus:ring-[#0092b3] shadow-2xs"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 px-5 text-xs font-bold rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-6 text-xs font-black rounded-xl bg-[#0092b3] hover:bg-[#007d99] text-white shadow-md shadow-[#0092b3]/25 cursor-pointer gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Saving Lead...</span>
                </>
              ) : (
                <span>Create Lead</span>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
