import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Lead, SiteVisit, Project } from '@/data/appData'
import { ApiService } from '@/services/apiService'
import { toast } from '@/components/common/ToastNotification'
import { Calendar, Car } from 'lucide-react'

interface ScheduleVisitModalProps {
  isOpen: boolean
  onClose: () => void
  targetLead?: Lead | null
  onScheduleVisit: (visit: SiteVisit) => void
}

export const ScheduleVisitModal: React.FC<ScheduleVisitModalProps> = ({
  isOpen,
  onClose,
  targetLead,
  onScheduleVisit,
}) => {
  const [leadName, setLeadName] = useState('')
  const [leadPhone, setLeadPhone] = useState('')
  const [projectList, setProjectList] = useState<Project[]>([])
  const [project, setProject] = useState('')
  const [date, setDate] = useState('2026-08-05')
  const [time, setTime] = useState('11:00 AM')
  const [salesExecutive, setSalesExecutive] = useState('Vikram Reddy')
  const [cabRequired, setCabRequired] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function loadProjects() {
      const projs = await ApiService.getProjects()
      if (projs && projs.length > 0) {
        setProjectList(projs)
        if (!targetLead?.project) {
          setProject(projs[0].name)
        }
      }
    }
    if (isOpen) {
      loadProjects()
    }
  }, [isOpen, targetLead])

  useEffect(() => {
    if (targetLead) {
      setLeadName(targetLead.name)
      setLeadPhone(targetLead.phone)
      setProject(targetLead.project || '')
    } else {
      setLeadName('')
      setLeadPhone('')
    }
  }, [targetLead, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!leadName || !leadPhone) {
      alert('Please provide Lead Name and Phone')
      return
    }

    const newVisit: SiteVisit = {
      id: `SV-${Math.floor(500 + Math.random() * 500)}`,
      leadName,
      leadPhone,
      project,
      date,
      time,
      salesExecutive,
      status: 'Scheduled',
      cabRequired,
      notes: notes || (cabRequired ? 'Chauffeur cab pickup requested.' : 'Self driving to site location.'),
    }

    toast.success(
      'Site Visit Scheduled!',
      `Site walkthrough for ${leadName} at ${project || 'Maytri property'} booked on ${date} (${time}).`
    )

    onScheduleVisit(newVisit)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-white/60 bg-white/95 backdrop-blur-xl text-slate-900 shadow-2xl rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#2a94b5]/10 text-[#2a94b5] font-semibold">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-slate-900">Schedule Site Visit Tour</DialogTitle>
              <DialogDescription className="text-xs text-slate-600 font-normal">
                Arrange property walkthrough and optional cab pickup for buyer
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 py-1 text-xs text-slate-800">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-semibold text-slate-800 block mb-1">
                Customer Name *
              </label>
              <Input
                placeholder="Ramesh Kumar"
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="font-semibold text-slate-800 block mb-1">
                Contact Phone *
              </label>
              <Input
                placeholder="+91 98765 43210"
                value={leadPhone}
                onChange={(e) => setLeadPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-semibold text-slate-800 block mb-1">
                Target Project
              </label>
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-900"
              >
                {projectList.length === 0 && project && (
                  <option value={project}>{project}</option>
                )}
                {projectList.length === 0 && !project && (
                  <option value="">No projects available</option>
                )}
                {projectList.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-800 block mb-1">
                Assigned Sales Executive
              </label>
              <select
                value={salesExecutive}
                onChange={(e) => setSalesExecutive(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-900"
              >
                <option value="Vikram Reddy">Vikram Reddy</option>
                <option value="Ananya Rao">Ananya Rao</option>
                <option value="Sneha Kapoor">Sneha Kapoor</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-semibold text-slate-800 block mb-1">
                Visit Date
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="font-semibold text-slate-800 block mb-1">
                Preferred Time Slot
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-900"
              >
                <option value="10:00 AM">10:00 AM</option>
                <option value="11:30 AM">11:30 AM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="04:30 PM">04:30 PM</option>
              </select>
            </div>
          </div>

          {/* Cab Pickup Toggle */}
          <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={cabRequired}
                onChange={(e) => setCabRequired(e.target.checked)}
                className="h-4 w-4 rounded accent-[#2a94b5]"
              />
              <span className="font-medium text-slate-800 flex items-center gap-1">
                <Car className="h-4 w-4 text-[#2a94b5]" /> Arrange Chauffeur Pickup
              </span>
            </label>

            {cabRequired && (
              <Input
                placeholder="Enter pickup address (e.g. Hitec City...)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-8 text-xs"
              />
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="h-8 text-xs font-medium border-slate-200 text-slate-700">
              Cancel
            </Button>
            <Button type="submit" variant="default" className="h-8 text-xs font-semibold bg-[#2a94b5] hover:bg-[#237d99] text-white">
              Confirm Appointment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
