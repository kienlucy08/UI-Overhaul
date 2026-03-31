import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronRight, User, MapPin, Briefcase, Wind, Thermometer,
  Cloud, FileText, Paperclip, ScanLine, ClipboardList, Plus,
  CheckCircle2, Clock, AlertCircle, ArrowRight, Edit2, Save, Share2, Copy, Check
} from 'lucide-react'
import { mockSiteVisit } from '../data/mockData'
import clsx from 'clsx'

const surveyStatusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  'Completed':   { color: 'bg-green-600/10 text-green-600 border-green-600/25',  icon: <CheckCircle2 size={13} /> },
  'In Progress': { color: 'bg-amber-500/10 text-amber-600 border-amber-500/30',  icon: <Clock size={13} /> },
  'Not Started': { color: 'bg-bg-gray-lm text-std-gray-lm border-nav-gray',      icon: <AlertCircle size={13} /> },
}

const statCards = (visit: typeof mockSiteVisit) => [
  { label: 'Surveys',      value: visit.surveys.length,      icon: ClipboardList, iconColor: 'text-teal-400',   bg: 'bg-teal-400/8',   valColor: 'text-teal-900' },
  { label: 'Contributors', value: visit.contributors.length, icon: User,          iconColor: 'text-indigo-500', bg: 'bg-indigo-500/8', valColor: 'text-indigo-500' },
  { label: 'Attachments',  value: visit.attachments.length,  icon: Paperclip,     iconColor: 'text-std-gray-lm',bg: 'bg-bg-gray-lm',   valColor: 'text-black' },
  { label: 'Scans',        value: visit.scans.length,        icon: ScanLine,      iconColor: 'text-teal-300',   bg: 'bg-teal-300/8',   valColor: 'text-teal-300' },
]

export default function SiteVisitPage() {
  const { siteId, visitId } = useParams()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const visit = mockSiteVisit

  function copyToClipboard(value: string, key: string) {
    navigator.clipboard.writeText(value)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-std-gray-lm">
        <button onClick={() => navigate('/sites')} className="hover:text-black transition-colors">Sites</button>
        <ChevronRight size={14} />
        <button onClick={() => navigate(`/sites/${siteId}`)} className="hover:text-black transition-colors">
          {visit.siteName}
        </button>
        <ChevronRight size={14} />
        <span className="text-black font-medium">Site Visit</span>
      </nav>

      {/* Hero card */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-teal-900">Site Visit</h1>
            <div className="flex items-center gap-1.5 mt-1.5 text-std-gray-lm">
              <MapPin size={14} className="text-teal-400" />
              <span className="text-sm">{visit.siteName}</span>
              <span className="text-nav-gray mx-1">·</span>
              <span className="text-sm font-mono">{visit.siteId}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary text-xs px-3 py-1.5">
              <Share2 size={13} /> Share
            </button>
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                <button onClick={() => setEditing(false)} className="btn-success text-xs px-3 py-1.5">
                  <Save size={13} /> Save Changes
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="btn-primary text-xs px-3 py-1.5">
                <Edit2 size={13} /> Edit Visit
              </button>
            )}
          </div>
        </div>

        {/* Stat counters */}
        <div className="grid grid-cols-4 gap-3">
          {statCards(visit).map(({ label, value, icon: Icon, iconColor, bg, valColor }) => (
            <div key={label} className={clsx('rounded-xl p-3 flex flex-col items-center gap-2', bg)}>
              <Icon size={20} className={iconColor} />
              <span className={clsx('text-2xl font-bold', valColor)}>{value}</span>
              <span className="text-xs text-std-gray-lm text-center font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Field group cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Site & Job */}
        <div className="rounded-lg border border-nav-gray p-4">
          <h3 className="text-xs font-semibold text-teal-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Briefcase size={13} /> Site & Job
          </h3>
          <div className="space-y-3">
            <FieldRow label="Customer"        value={visit.customer}       editing={editing} fieldKey="customer"       onCopy={copyToClipboard} copiedKey={copiedKey} />
            <FieldRow label="Site Name"       value={visit.siteName}       editing={editing} fieldKey="siteName"       onCopy={copyToClipboard} copiedKey={copiedKey} />
            <FieldRow label="Site ID"         value={visit.siteId}         editing={editing} fieldKey="siteId"         onCopy={copyToClipboard} copiedKey={copiedKey} mono />
            <FieldRow label="Structure Owner" value={visit.structureOwner} editing={editing} fieldKey="structureOwner" onCopy={copyToClipboard} copiedKey={copiedKey} />
            <FieldRow label="Project Code"    value={visit.projectCode}    editing={editing} fieldKey="projectCode"    onCopy={copyToClipboard} copiedKey={copiedKey} />
            <FieldRow label="Scope of Work"   value={visit.scopeOfWork}    editing={editing} fieldKey="scopeOfWork"    onCopy={copyToClipboard} copiedKey={copiedKey} />
          </div>
        </div>

        {/* Location */}
        <div className="rounded-lg border border-nav-gray p-4">
          <h3 className="text-xs font-semibold text-teal-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <MapPin size={13} /> Location
          </h3>
          <div className="space-y-3">
            <FieldRow label="Site Address"     value={visit.siteAddress}     editing={editing} fieldKey="siteAddress"     onCopy={copyToClipboard} copiedKey={copiedKey} />
            <FieldRow label="Site Coordinates" value={visit.siteCoordinates} editing={editing} fieldKey="siteCoordinates" onCopy={copyToClipboard} copiedKey={copiedKey} mono />
          </div>
        </div>

        {/* Site Conditions */}
        <div className="rounded-lg border border-nav-gray p-4">
          <h3 className="text-xs font-semibold text-teal-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Cloud size={13} /> Site Conditions
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <ConditionBadge icon={<Thermometer size={15} />} label="Temperature"   value={visit.temperature}   color="text-orange-500" />
            <ConditionBadge icon={<Wind size={15} />}        label="Wind Speed"    value={visit.windSpeed}     color="text-teal-400" />
            <ConditionBadge icon={<Wind size={15} className="rotate-45" />} label="Direction" value={visit.windDirection} color="text-teal-300" />
            <ConditionBadge icon={<Cloud size={15} />}       label="Weather"       value={visit.weather}       color="text-std-gray-lm" />
          </div>
        </div>

        {/* Contributors */}
        <div className="rounded-lg border border-nav-gray p-4">
          <h3 className="text-xs font-semibold text-teal-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <User size={13} /> Contributors
          </h3>
          <div className="space-y-2">
            {visit.contributors.map((c) => (
              <div key={c.email} className="flex items-center p-2 rounded-lg hover:bg-hover-gray-lm transition-colors">
                <div className="w-7 h-7 rounded-full bg-teal-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {c.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="ml-2.5">
                  <p className="text-sm font-medium text-black leading-tight">{c.name}</p>
                  <p className="text-xs text-blue-400">{c.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Close-out Package */}
        <div className="rounded-lg border border-nav-gray p-4">
          <h3 className="text-xs font-semibold text-teal-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <ClipboardList size={13} /> Close-out Package
          </h3>
          <div className="space-y-3">
            <FieldRow label="Work Order"          value={visit.closeOutPackage.workOrder}          editing={editing} fieldKey="workOrder"          onCopy={copyToClipboard} copiedKey={copiedKey} />
            <FieldRow label="Applicable Sections" value={visit.closeOutPackage.applicableSections} editing={editing} fieldKey="applicableSections" onCopy={copyToClipboard} copiedKey={copiedKey} mono />
            <FieldRow label="Work Completed"      value={visit.closeOutPackage.workCompleted}      editing={editing} fieldKey="workCompleted"      onCopy={copyToClipboard} copiedKey={copiedKey} />
            <FieldRow label="Return Visit Needed" value={visit.closeOutPackage.returnVisitNeeded}  editing={editing} fieldKey="returnVisitNeeded"  onCopy={copyToClipboard} copiedKey={copiedKey} />
          </div>
        </div>
      </div>

      {/* Section cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* JSA Report */}
        <SectionCard
          title="JSA Report"
          count={0}
          icon={<FileText size={16} className="text-amber-600" />}
          action={<button className="btn-secondary text-xs px-2.5 py-1.5">Link Report</button>}
        >
          <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-nav-gray rounded-xl text-std-gray-lm">
            <FileText size={24} className="mb-2 text-nav-gray" />
            <p className="text-sm font-medium">No JSA report linked</p>
            <button className="mt-1.5 text-xs text-blue-400 hover:underline">Link Existing Report</button>
          </div>
        </SectionCard>

        {/* Attachments */}
        <SectionCard
          title="Attachments"
          count={visit.attachments.length}
          icon={<Paperclip size={16} className="text-std-gray-lm" />}
        >
          <button className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-nav-gray text-sm text-std-gray-lm hover:border-teal-400 hover:text-teal-400 hover:bg-teal-400/5 transition-colors">
            <Plus size={16} /> Add Attachment
          </button>
        </SectionCard>

        {/* Scans */}
        <SectionCard
          title="Scans"
          count={visit.scans.length}
          icon={<ScanLine size={16} className="text-teal-400" />}
        >
          <button className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-nav-gray text-sm text-std-gray-lm hover:border-teal-300 hover:text-teal-400 hover:bg-teal-300/5 transition-colors">
            <Plus size={16} /> Add Scan
          </button>
        </SectionCard>

        {/* Surveys */}
        <SectionCard
          title="Surveys"
          count={visit.surveys.length}
          icon={<ClipboardList size={16} className="text-teal-400" />}
          action={
            <button className="btn-primary text-xs px-2.5 py-1.5">
              <Plus size={13} /> Add Survey
            </button>
          }
        >
          {visit.surveys.map((survey) => {
            const progress = Math.round((survey.completedFields / survey.totalFields) * 100)
            const statusCfg = surveyStatusConfig[survey.status] ?? surveyStatusConfig['Not Started']
            return (
              <div
                key={survey.id}
                onClick={() => navigate(`/surveys/${survey.id}/qc`)}
                className="flex items-center justify-between p-3 rounded-lg border border-nav-gray hover:border-teal-400/40 hover:bg-teal-400/5 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-teal-400/8 border border-teal-400/20 flex items-center justify-center flex-shrink-0">
                    <ClipboardList size={16} className="text-teal-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-black truncate">{survey.name}</p>
                    <p className="text-xs text-std-gray-lm">{survey.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="hidden sm:flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-bg-gray-lm rounded-full overflow-hidden">
                        <div
                          className={clsx('h-full rounded-full transition-all', progress === 100 ? 'bg-green-600' : 'bg-teal-300')}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-std-gray-lm w-7 text-right">{progress}%</span>
                    </div>
                    <span className="text-xs text-std-gray-lm">{survey.completedFields}/{survey.totalFields} fields</span>
                  </div>
                  <span className={clsx('badge border flex items-center gap-1', statusCfg.color)}>
                    {statusCfg.icon}{survey.status}
                  </span>
                  <ArrowRight size={15} className="text-nav-gray group-hover:text-teal-400 transition-colors" />
                </div>
              </div>
            )
          })}
        </SectionCard>
      </div>
    </div>
  )
}

function SectionCard({
  title, count, icon, children, action
}: {
  title: string
  count: number
  icon: React.ReactNode
  children?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-base font-semibold text-black">
            {title}
            <span className="ml-2 text-sm font-normal text-std-gray-lm">({count})</span>
          </h2>
        </div>
        {action}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function FieldRow({
  label, value, editing, fieldKey, onCopy, copiedKey, mono
}: {
  label: string
  value: string
  editing?: boolean
  fieldKey: string
  onCopy: (value: string, key: string) => void
  copiedKey: string | null
  mono?: boolean
}) {
  if (editing) {
    return (
      <div>
        <label className="text-xs text-std-gray-lm mb-1 block">{label}</label>
        <input
          defaultValue={value}
          className="w-full px-3 py-1.5 text-sm border border-nav-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-transparent"
        />
      </div>
    )
  }
  return (
    <div className="group/field flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs text-std-gray-lm mb-0.5">{label}</p>
        <p className={clsx('text-sm font-medium text-black break-words', mono && 'font-mono text-xs text-std-gray-lm')}>
          {value || <span className="text-std-gray-dm italic">—</span>}
        </p>
      </div>
      {value && (
        <button
          onClick={() => onCopy(value, fieldKey)}
          className="p-1 rounded text-nav-gray hover:text-std-gray-lm hover:bg-hover-gray-lm opacity-0 group-hover/field:opacity-100 transition-all flex-shrink-0 mt-4"
        >
          {copiedKey === fieldKey ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
        </button>
      )}
    </div>
  )
}

function ConditionBadge({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1 p-2.5 rounded-lg border border-nav-gray">
      <span className={color}>{icon}</span>
      <span className="text-sm font-bold text-black">{value}</span>
      <span className="text-xs text-std-gray-lm text-center">{label}</span>
    </div>
  )
}
