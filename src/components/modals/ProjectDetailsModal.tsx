import React, { useState } from 'react'
import {
  X,
  Building2,
  MapPin,
  FileText,
  Download,
  Calendar,
  ShieldCheck,
  Tag,
  Users,
  Image as ImageIcon,
  Film,
  Layers,
  Sparkles,
  CheckCircle2,
  Plus,
  Maximize2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Project, Lead, ProjectMedia } from '@/data/appData'

interface ProjectDetailsModalProps {
  project: Project | null
  leads: Lead[]
  isOpen: boolean
  onClose: () => void
  onOpenAddLead?: (projectName?: string) => void
}

export const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({
  project,
  leads,
  isOpen,
  onClose,
  onOpenAddLead,
}) => {
  const [selectedMedia, setSelectedMedia] = useState<ProjectMedia | null>(null)

  if (!isOpen || !project) return null

  const projectLeads = leads.filter(
    (l) =>
      l.project?.toLowerCase().includes(project.name.toLowerCase()) ||
      project.name.toLowerCase().includes(l.project?.toLowerCase())
  )

  // Strictly use backend media array from API without synthesizing items
  const mediaList: ProjectMedia[] =
    project.media && Array.isArray(project.media) ? project.media : []

  const backendThumbnail = project.thumbnail || null

  const handleDownloadBrochure = () => {
    if (project.brochure) {
      window.open(project.brochure, '_blank')
    } else {
      const blob = new Blob(
        [
          `Maytri Group - Project Information\n\nProject: ${project.name}\nProject Code: ${project.projectCode || 'N/A'}\nSlug: ${project.slug || 'N/A'}\nLocation: ${project.location}\nCity: ${project.city || ''}, ${project.state || ''} - ${project.pincode || ''}\nRERA No: ${project.reraNumber || 'N/A'}\nDeveloper: ${project.developerName || 'N/A'}\nStart Date: ${project.startDate || 'N/A'}\nCompletion Date: ${project.completionDate || 'N/A'}\nStatus: ${project.status}\n\nDescription: ${project.description || 'N/A'}\n`,
        ],
        { type: 'text/plain' }
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.name.replace(/\s+/g, '_')}_Brochure.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const getMediaIcon = (type: string) => {
    switch ((type || '').toUpperCase()) {
      case 'VIDEO':
        return <Film className="h-3.5 w-3.5 text-purple-400" />
      case 'FLOOR_PLAN':
        return <Layers className="h-3.5 w-3.5 text-amber-400" />
      default:
        return <ImageIcon className="h-3.5 w-3.5 text-cyan-400" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        {backendThumbnail ? (
          <div className="relative h-44 sm:h-52 w-full bg-slate-950 overflow-hidden shrink-0">
            <img
              src={backendThumbnail}
              alt={project.name}
              className="w-full h-full object-cover object-center brightness-75 transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 h-9 w-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Project Header Info */}
            <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  {project.projectCode && (
                    <span className="text-[10px] font-extrabold text-cyan-300 bg-black/50 backdrop-blur-md px-2.5 py-0.5 rounded-md border border-cyan-500/30 uppercase tracking-wider">
                      Code: {project.projectCode}
                    </span>
                  )}
                  {project.slug && (
                    <span className="text-[10px] font-bold text-slate-300 bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-md border border-white/10">
                      /{project.slug}
                    </span>
                  )}
                  {project.status && (
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider bg-emerald-500/30 text-emerald-300 border border-emerald-400/40">
                      {project.status}
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
                  {project.name}
                </h2>
                {project.location && (
                  <p className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 drop-shadow-xs">
                    <MapPin className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span>
                      {project.location}
                      {project.city ? `, ${project.city}` : ''}
                      {project.state ? `, ${project.state}` : ''}
                      {project.pincode ? ` - ${project.pincode}` : ''}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-950 text-white shrink-0 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-1.5 pr-8">
              <div className="flex flex-wrap items-center gap-2">
                {project.projectCode && (
                  <span className="text-[10px] font-extrabold text-cyan-300 bg-cyan-950/60 px-2.5 py-0.5 rounded-md border border-cyan-500/30 uppercase tracking-wider">
                    Code: {project.projectCode}
                  </span>
                )}
                {project.slug && (
                  <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-md">
                    /{project.slug}
                  </span>
                )}
                {project.status && (
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider bg-emerald-950/70 text-emerald-300 border border-emerald-500/40">
                    {project.status}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {project.name}
              </h2>
              {project.location && (
                <p className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#0092b3] shrink-0" />
                  <span>
                    {project.location}
                    {project.city ? `, ${project.city}` : ''}
                    {project.state ? `, ${project.state}` : ''}
                    {project.pincode ? ` - ${project.pincode}` : ''}
                  </span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800 font-sans">
          {/* Project Description (only if exists in API) */}
          {project.description && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#0092b3]" /> Project Description
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                {project.description}
              </p>
            </div>
          )}

          {/* PROJECT MEDIA GALLERY (only if media exists) */}
          {mediaList.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-[#0092b3]" /> Project Media ({mediaList.length})
                </h4>
                <span className="text-[11px] font-bold text-[#0092b3]">Click to preview</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {mediaList.map((m, idx) => (
                  <div
                    key={m.id || idx}
                    onClick={() => setSelectedMedia(m)}
                    className="group relative h-28 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 cursor-pointer shadow-xs hover:shadow-md transition-all"
                  >
                    <img
                      src={m.file_url}
                      alt={m.title || `Media ${idx + 1}`}
                      className="w-full h-full object-cover brightness-90 group-hover:scale-105 group-hover:brightness-100 transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />

                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[9px] font-black text-white border border-white/20 flex items-center gap-1">
                      {getMediaIcon(m.media_type)}
                      {m.media_type || 'MEDIA'}
                    </span>

                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 className="h-3 w-3" />
                    </div>

                    <p className="absolute bottom-2 left-2.5 right-2.5 text-[11px] font-bold text-white truncate drop-shadow-sm">
                      {m.title || `Media Asset #${idx + 1}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BACKEND API SPECIFICATIONS GRID */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-[#0092b3]" /> Project Specifications
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#0092b3]" /> RERA Number
                </span>
                <p className="font-extrabold text-slate-900">{project.reraNumber || '-'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-[#0092b3]" /> Developer Name
                </span>
                <p className="font-extrabold text-slate-900">{project.developerName || '-'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-[#0092b3]" /> Pipeline Leads
                </span>
                <p className="font-extrabold text-[#0092b3] text-sm">{projectLeads.length} Leads</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-purple-600" /> Start Date
                </span>
                <p className="font-extrabold text-slate-900">{project.startDate || '-'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-emerald-600" /> Completion Date
                </span>
                <p className="font-extrabold text-slate-900">{project.completionDate || '-'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-rose-500" /> City & State
                </span>
                <p className="font-extrabold text-slate-900 truncate">
                  {project.city || '-'}, {project.state || '-'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-amber-500" /> Pincode
                </span>
                <p className="font-extrabold text-slate-900">{project.pincode || '-'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5 text-blue-500" /> Project Code
                </span>
                <p className="font-extrabold text-slate-900">{project.projectCode || `PRJ-${project.id}`}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Active Flag
                </span>
                <p className="font-extrabold text-slate-900">{project.isActive ? 'Active (True)' : 'Inactive (False)'}</p>
              </div>
            </div>
          </div>

          {/* Project Brochure Download (if brochure URL exists) */}
          {project.brochure && (
            <div className="p-4 rounded-2xl bg-[#0092b3]/10 border border-[#0092b3]/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-left">
                <div className="h-10 w-10 rounded-2xl bg-[#0092b3] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-900">Project Official Brochure</h5>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Official PDF brochure provided from backend
                  </p>
                </div>
              </div>
              <Button
                onClick={handleDownloadBrochure}
                size="sm"
                className="h-9 px-4 bg-[#0092b3] hover:bg-[#007d99] text-white font-extrabold text-xs gap-1.5 rounded-xl shadow-xs cursor-pointer shrink-0"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Brochure</span>
              </Button>
            </div>
          )}
        </div>

        {/* MODAL FOOTER ACTIONS */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-9 border-slate-300 text-slate-700 font-bold text-xs rounded-xl px-4 cursor-pointer"
          >
            Close
          </Button>

          {onOpenAddLead && (
            <Button
              onClick={() => {
                onClose()
                onOpenAddLead(project.name)
              }}
              className="h-9 bg-[#0092b3] hover:bg-[#007d99] text-white font-extrabold text-xs gap-1.5 rounded-xl px-5 shadow-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Add Lead For This Project</span>
            </Button>
          )}
        </div>
      </div>

      {/* MEDIA PREVIEW LIGHTBOX MODAL */}
      {selectedMedia && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative max-w-3xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-white/20 shadow-2xl flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-slate-800">
              <span className="text-xs font-extrabold text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                {getMediaIcon(selectedMedia.media_type)}
                {selectedMedia.media_type}
              </span>
              <h4 className="text-sm font-bold text-white truncate max-w-xs">{selectedMedia.title}</h4>
              <button
                onClick={() => setSelectedMedia(null)}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-2 bg-black flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={selectedMedia.file_url}
                alt={selectedMedia.title}
                className="max-h-[68vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectDetailsModal
