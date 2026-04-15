import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ClipboardList, ScanLine, CalendarDays, MapPin,
  Search, ArrowUpRight, MoreHorizontal,
  Download, Trash2, FileImage, Pencil
} from 'lucide-react'
import {
  mockDashboardSurveys,
  mockDashboardScans,
  mockDashboardSiteVisits,
  mockSitesList,
  type SurveyType,
} from '../data/mockData'
import clsx from 'clsx'

type Tab = 'surveys' | 'scans' | 'sitevisits' | 'sites'

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'surveys',    label: 'Surveys',     icon: <ClipboardList size={15} /> },
  { id: 'scans',      label: 'Scans',       icon: <ScanLine size={15} /> },
  { id: 'sitevisits', label: 'Site Visits', icon: <CalendarDays size={15} /> },
  { id: 'sites',      label: 'Sites',       icon: <MapPin size={15} /> },
]

const statusConfig: Record<string, { bg: string; text: string; border: string }> = {
  'In Progress': { bg: 'bg-amber-500/10',  text: 'text-amber-600',    border: 'border-amber-500/30' },
  'QA Review':   { bg: 'bg-teal-300/10',   text: 'text-teal-600',     border: 'border-teal-300/40' },
  'Submitted':   { bg: 'bg-indigo-500/10', text: 'text-indigo-500',   border: 'border-indigo-500/30' },
  'Completed':   { bg: 'bg-green-600/10',  text: 'text-green-600',    border: 'border-green-600/30' },
  'Not Started': { bg: 'bg-bg-gray-lm/50', text: 'text-std-gray-lm',  border: 'border-std-gray-lm/20' },
  'Processing':  { bg: 'bg-blue-500/10',   text: 'text-blue-500',     border: 'border-blue-500/30' },
  'active':      { bg: 'bg-green-600/10',  text: 'text-green-600',    border: 'border-green-600/25' },
  'inactive':    { bg: 'bg-bg-gray-lm',    text: 'text-std-gray-lm',  border: 'border-nav-gray' },
}


const surveyTypeConfig: Record<SurveyType, { bg: string; text: string; border: string }> = {
  'Compound':        { bg: 'bg-teal-400/10',    text: 'text-teal-600',    border: 'border-teal-400/30' },
  'Structure Climb': { bg: 'bg-blue-500/10',    text: 'text-blue-600',    border: 'border-blue-500/30' },
  'Structure Flight':{ bg: 'bg-indigo-500/10',  text: 'text-indigo-600',  border: 'border-indigo-500/30' },
  'Service COP':     { bg: 'bg-amber-500/10',   text: 'text-amber-600',   border: 'border-amber-500/30' },
  'Plumb & Twist':   { bg: 'bg-purple-500/10',  text: 'text-purple-600',  border: 'border-purple-500/30' },
  'Guy Facilities':  { bg: 'bg-green-600/10',   text: 'text-green-700',   border: 'border-green-600/30' },
}

function SurveyTypeBadge({ type }: { type: SurveyType }) {
  const cfg = surveyTypeConfig[type]
  return <span className={clsx('badge border text-xs', cfg.bg, cfg.text, cfg.border)}>{type}</span>
}

type MenuItem = { label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? statusConfig['Not Started']
  return <span className={clsx('badge border text-xs', cfg.bg, cfg.text, cfg.border)}>{status}</span>
}

function TableCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      className={clsx(
        'w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-colors flex-shrink-0',
        checked ? 'bg-indigo-500 border-indigo-500' : 'border-nav-gray hover:border-indigo-400'
      )}
    >
      {checked && <span className="text-white text-[10px] font-bold leading-none">✓</span>}
    </div>
  )
}

function SortHeader({ label, field, sortField, sortDir, onSort }: {
  label: string; field: string; sortField: string; sortDir: 'asc' | 'desc'; onSort: (f: string) => void
}) {
  const active = sortField === field
  return (
    <button
      onClick={() => onSort(field)}
      className="group flex items-center gap-1 text-xs font-semibold text-std-gray-lm uppercase tracking-wide hover:text-black transition-colors"
    >
      {label}
      <span className={clsx('ml-0.5 text-xs', active ? 'text-teal-400' : 'text-transparent group-hover:text-std-gray-lm')}>
        {active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </button>
  )
}

function RowMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation()
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const estimatedHeight = 44 + items.length * 36
      setOpenUp(rect.bottom + estimatedHeight > window.innerHeight - 16)
    }
    setOpen(o => !o)
  }

  return (
    <div ref={ref} className="relative">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="p-1.5 rounded-lg text-std-gray-lm hover:bg-bg-gray-lm hover:text-black transition-colors"
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div className={clsx('absolute right-0 z-50 bg-white border border-nav-gray rounded-xl shadow-lg py-1.5 min-w-[190px]', openUp ? 'bottom-8' : 'top-8')}>
          <p className="px-3 pb-1 pt-0.5 text-xs font-semibold text-std-gray-lm uppercase tracking-wide">Actions</p>
          {items.map(item => (
            <button
              key={item.label}
              onClick={e => { e.stopPropagation(); item.onClick(); setOpen(false) }}
              className={clsx(
                'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left',
                item.danger
                  ? 'text-red-600 hover:bg-red-600/5'
                  : 'text-black hover:bg-hover-gray-lm'
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function QADashboardPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('surveys')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState('created')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  function switchTab(tab: Tab) {
    setActiveTab(tab); setSelected(new Set()); setSearch(''); setSortField('created'); setSortDir('desc')
  }

  function toggleSort(field: string) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function toggleSelectAll(ids: string[]) {
    if (selected.size === ids.length) setSelected(new Set())
    else setSelected(new Set(ids))
  }

  function sortRows<T>(rows: T[]): T[] {
    return [...rows].sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortField]?.toString() ?? ''
      const bv = (b as Record<string, unknown>)[sortField]?.toString() ?? ''
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }

  const filteredSurveys = sortRows(mockDashboardSurveys.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return s.name.toLowerCase().includes(q) || s.siteName.toLowerCase().includes(q) || s.siteId.toLowerCase().includes(q)
  }))

  const filteredScans = sortRows(mockDashboardScans.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return s.name.toLowerCase().includes(q) || s.siteName.toLowerCase().includes(q) || s.siteId.toLowerCase().includes(q)
  }))

  const filteredVisits = sortRows(mockDashboardSiteVisits.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return s.name.toLowerCase().includes(q) || s.siteName.toLowerCase().includes(q) || s.siteId.toLowerCase().includes(q)
  }))

  const filteredSites = sortRows(mockSitesList.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.owner.toLowerCase().includes(q)
  }))

  // Shared bulk actions bar content
  const bulkBar = () => (
    <div className="ml-auto flex items-center gap-2">
      {selected.size > 0 && (
        <>
          <span className="text-xs text-std-gray-lm">
            {selected.size} selected
          </span>
          <button className="btn-primary text-xs px-2.5 py-1.5">
            <CalendarDays size={13} /> Add to Site Visit
          </button>
          <button className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-red-600/30 bg-red-600/8 text-red-600 hover:bg-red-600/15 transition-colors">
            <Trash2 size={13} /> Delete ({selected.size})
          </button>
        </>
      )}
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="bg-white border-b border-nav-gray px-6 pt-5 pb-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-black">Dashboard</h1>
          <span className="text-xs text-std-gray-lm font-medium">Dashboard</span>
        </div>
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-teal-300 text-teal-400'
                  : 'border-transparent text-std-gray-lm hover:text-black hover:border-nav-gray'
              )}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">

        {/* ── Surveys ── */}
        {activeTab === 'surveys' && (
          <div className="card overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-nav-gray flex-wrap gap-y-2 bg-hover-gray-lm/50">
              <div className="flex items-center gap-2 bg-white border border-nav-gray rounded-lg px-3 py-2 w-52">
                <Search size={14} className="text-std-gray-lm flex-shrink-0" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter..."
                  className="bg-transparent text-sm text-black placeholder-std-gray-lm outline-none w-full" />
              </div>
              {bulkBar()}
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-nav-gray bg-bg-gray-lm/60">
                  <th className="w-10 px-5 py-3">
                    <TableCheckbox checked={selected.size === filteredSurveys.length && filteredSurveys.length > 0} onChange={() => toggleSelectAll(filteredSurveys.map(s => s.id))} />
                  </th>
                  <th className="px-3 py-3 text-left"><SortHeader label="Survey"    field="type"     sortField={sortField} sortDir={sortDir} onSort={toggleSort} /></th>
                  <th className="px-3 py-3 text-left"><SortHeader label="Site ID"   field="siteId"   sortField={sortField} sortDir={sortDir} onSort={toggleSort} /></th>
                  <th className="px-3 py-3 text-left"><SortHeader label="Site Name" field="siteName" sortField={sortField} sortDir={sortDir} onSort={toggleSort} /></th>
                  <th className="px-3 py-3 text-left"><SortHeader label="Created"   field="created"  sortField={sortField} sortDir={sortDir} onSort={toggleSort} /></th>
                  <th className="px-3 py-3 text-left"><span className="text-xs font-semibold text-std-gray-lm uppercase tracking-wide">Status</span></th>
                  <th className="w-52 px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-nav-gray/50">
                {filteredSurveys.map(survey => (
                  <tr key={survey.id} className={clsx('group hover:bg-hover-gray-lm transition-colors', selected.has(survey.id) && 'bg-teal-100/20')}>
                    <td className="px-5 py-3.5"><TableCheckbox checked={selected.has(survey.id)} onChange={() => toggleSelect(survey.id)} /></td>
                    <td className="px-3 py-3.5"><SurveyTypeBadge type={survey.type} /></td>
                    <td className="px-3 py-3.5"><span className="text-sm text-std-gray-lm font-mono">{survey.siteId || '—'}</span></td>
                    <td className="px-3 py-3.5"><span className="text-sm text-black">{survey.siteName}</span></td>
                    <td className="px-3 py-3.5"><span className="text-sm text-std-gray-lm">{survey.created}</span></td>
                    <td className="px-3 py-3.5"><StatusBadge status={survey.status} /></td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/surveys/${survey.id}/qc`)}
                          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-teal-400/10 text-teal-600 hover:bg-teal-400/20 transition-colors"
                        >
                          <ArrowUpRight size={13} /> Open QC Editor
                        </button>
                        <RowMenu items={[
                          { label: 'Open QC Editor',     icon: <ArrowUpRight size={14} />, onClick: () => navigate(`/surveys/${survey.id}/qc`) },
                          { label: 'Add to Site Visit',  icon: <CalendarDays size={14} />, onClick: () => {} },
                          { label: 'Download JSON',       icon: <Download size={14} />,     onClick: () => {} },
                          { label: 'Create Image Export', icon: <FileImage size={14} />,    onClick: () => {} },
                          { label: 'Delete Survey',       icon: <Trash2 size={14} />,       onClick: () => {}, danger: true },
                        ]} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSurveys.length === 0 && <EmptyState icon={<ClipboardList size={28} />} label="No surveys match your filters" />}
          </div>
        )}

        {/* ── Scans ── */}
        {activeTab === 'scans' && (
          <div className="card overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-nav-gray flex-wrap gap-y-2 bg-hover-gray-lm/50">
              <div className="flex items-center gap-2 bg-white border border-nav-gray rounded-lg px-3 py-2 w-52">
                <Search size={14} className="text-std-gray-lm flex-shrink-0" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter..."
                  className="bg-transparent text-sm text-black placeholder-std-gray-lm outline-none w-full" />
              </div>
              {bulkBar()}
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-nav-gray bg-bg-gray-lm/60">
                  <th className="w-10 px-5 py-3">
                    <TableCheckbox checked={selected.size === filteredScans.length && filteredScans.length > 0} onChange={() => toggleSelectAll(filteredScans.map(s => s.id))} />
                  </th>
                  <th className="px-3 py-3 text-left"><SortHeader label="Name"      field="name"     sortField={sortField} sortDir={sortDir} onSort={toggleSort} /></th>
                  <th className="px-3 py-3 text-left"><SortHeader label="Site ID"   field="siteId"   sortField={sortField} sortDir={sortDir} onSort={toggleSort} /></th>
                  <th className="px-3 py-3 text-left"><SortHeader label="Site Name" field="siteName" sortField={sortField} sortDir={sortDir} onSort={toggleSort} /></th>
                  <th className="px-3 py-3 text-left"><SortHeader label="Created"   field="created"  sortField={sortField} sortDir={sortDir} onSort={toggleSort} /></th>
                  <th className="px-3 py-3 text-left"><span className="text-xs font-semibold text-std-gray-lm uppercase tracking-wide">Status</span></th>
                  <th className="w-32 px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-nav-gray/50">
                {filteredScans.map(scan => (
                  <tr key={scan.id} className={clsx('group hover:bg-hover-gray-lm transition-colors', selected.has(scan.id) && 'bg-teal-100/20')}>
                    <td className="px-5 py-3.5"><TableCheckbox checked={selected.has(scan.id)} onChange={() => toggleSelect(scan.id)} /></td>
                    <td className="px-3 py-3.5">
                      <p className="text-sm font-medium text-black">{scan.name}</p>
                      <p className="text-xs text-std-gray-lm">{scan.type}</p>
                    </td>
                    <td className="px-3 py-3.5"><span className="text-sm text-std-gray-lm font-mono">{scan.siteId}</span></td>
                    <td className="px-3 py-3.5"><span className="text-sm text-black">{scan.siteName}</span></td>
                    <td className="px-3 py-3.5"><span className="text-sm text-std-gray-lm">{scan.created}</span></td>
                    <td className="px-3 py-3.5"><StatusBadge status={scan.status} /></td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-teal-400/10 text-teal-600 hover:bg-teal-400/20 transition-colors">
                          <ArrowUpRight size={13} /> View Scan
                        </button>
                        <RowMenu items={[
                          { label: 'View Scan',     icon: <ArrowUpRight size={14} />, onClick: () => {} },
                          { label: 'Download JSON', icon: <Download size={14} />,     onClick: () => {} },
                          { label: 'Delete Scan',   icon: <Trash2 size={14} />,       onClick: () => {}, danger: true },
                        ]} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredScans.length === 0 && <EmptyState icon={<ScanLine size={28} />} label="No scans found" />}
          </div>
        )}

        {/* ── Site Visits ── */}
        {activeTab === 'sitevisits' && (
          <div className="card overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-nav-gray flex-wrap gap-y-2 bg-hover-gray-lm/50">
              <div className="flex items-center gap-2 bg-white border border-nav-gray rounded-lg px-3 py-2 w-52">
                <Search size={14} className="text-std-gray-lm flex-shrink-0" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter..."
                  className="bg-transparent text-sm text-black placeholder-std-gray-lm outline-none w-full" />
              </div>
              {bulkBar()}
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-nav-gray bg-bg-gray-lm/60">
                  <th className="w-10 px-5 py-3">
                    <TableCheckbox checked={selected.size === filteredVisits.length && filteredVisits.length > 0} onChange={() => toggleSelectAll(filteredVisits.map(v => v.id))} />
                  </th>
                  <th className="px-3 py-3 text-left"><SortHeader label="Name"      field="name"     sortField={sortField} sortDir={sortDir} onSort={toggleSort} /></th>
                  <th className="px-3 py-3 text-left"><SortHeader label="Site ID"   field="siteId"   sortField={sortField} sortDir={sortDir} onSort={toggleSort} /></th>
                  <th className="px-3 py-3 text-left"><SortHeader label="Site Name" field="siteName" sortField={sortField} sortDir={sortDir} onSort={toggleSort} /></th>
                  <th className="px-3 py-3 text-left"><SortHeader label="Created"   field="created"  sortField={sortField} sortDir={sortDir} onSort={toggleSort} /></th>
                  <th className="px-3 py-3 text-left"><span className="text-xs font-semibold text-std-gray-lm uppercase tracking-wide">Surveys</span></th>
                  <th className="px-3 py-3 text-left"><span className="text-xs font-semibold text-std-gray-lm uppercase tracking-wide">Status</span></th>
                  <th className="w-32 px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-nav-gray/50">
                {filteredVisits.map(visit => (
                  <tr key={visit.id} className={clsx('group hover:bg-hover-gray-lm transition-colors', selected.has(visit.id) && 'bg-teal-100/20')}>
                    <td className="px-5 py-3.5"><TableCheckbox checked={selected.has(visit.id)} onChange={() => toggleSelect(visit.id)} /></td>
                    <td className="px-3 py-3.5">
                      <p className="text-sm font-medium text-black">{visit.name}</p>
                      <p className="text-xs text-std-gray-lm">{visit.type}</p>
                    </td>
                    <td className="px-3 py-3.5"><span className="text-sm text-std-gray-lm font-mono">{visit.siteId}</span></td>
                    <td className="px-3 py-3.5"><span className="text-sm text-black">{visit.siteName}</span></td>
                    <td className="px-3 py-3.5"><span className="text-sm text-std-gray-lm">{visit.created}</span></td>
                    <td className="px-3 py-3.5"><span className="text-sm text-black">{visit.surveyCount}</span></td>
                    <td className="px-3 py-3.5"><StatusBadge status={visit.status} /></td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/sites/${visit.siteId}/visits/${visit.id}`)}
                          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-teal-400/10 text-teal-600 hover:bg-teal-400/20 transition-colors"
                        >
                          <ArrowUpRight size={13} /> View Site Visit
                        </button>
                        <RowMenu items={[
                          { label: 'View Site Visit',         icon: <ArrowUpRight size={14} />, onClick: () => navigate(`/sites/${visit.siteId}/visits/${visit.id}`) },
                          { label: 'Create Attachment Export',icon: <FileImage size={14} />,    onClick: () => {} },
                          { label: 'Remove from Site',        icon: <Pencil size={14} />,       onClick: () => {} },
                          { label: 'Delete Site Visit',       icon: <Trash2 size={14} />,       onClick: () => {}, danger: true },
                        ]} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredVisits.length === 0 && <EmptyState icon={<CalendarDays size={28} />} label="No site visits found" />}
          </div>
        )}

        {/* ── Sites ── */}
        {activeTab === 'sites' && (
          <div className="card overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-nav-gray flex-wrap gap-y-2 bg-hover-gray-lm/50">
              <div className="flex items-center gap-2 bg-white border border-nav-gray rounded-lg px-3 py-2 w-52">
                <Search size={14} className="text-std-gray-lm flex-shrink-0" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter..."
                  className="bg-transparent text-sm text-black placeholder-std-gray-lm outline-none w-full" />
              </div>
              {bulkBar()}
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-nav-gray bg-bg-gray-lm/60">
                  <th className="w-10 px-5 py-3">
                    <TableCheckbox checked={selected.size === filteredSites.length && filteredSites.length > 0} onChange={() => toggleSelectAll(filteredSites.map(s => s.id))} />
                  </th>
                  <th className="px-3 py-3 text-left"><SortHeader label="Name"        field="name"    sortField={sortField} sortDir={sortDir} onSort={toggleSort} /></th>
                  <th className="px-3 py-3 text-left"><SortHeader label="Owner"       field="owner"   sortField={sortField} sortDir={sortDir} onSort={toggleSort} /></th>
                  <th className="px-3 py-3 text-left"><SortHeader label="Site ID"     field="id"      sortField={sortField} sortDir={sortDir} onSort={toggleSort} /></th>
                  <th className="px-3 py-3 text-left"><SortHeader label="Created"     field="created" sortField={sortField} sortDir={sortDir} onSort={toggleSort} /></th>
                  <th className="px-3 py-3 text-left"><span className="text-xs font-semibold text-std-gray-lm uppercase tracking-wide">Site Visits</span></th>
                  <th className="px-3 py-3 text-left"><span className="text-xs font-semibold text-std-gray-lm uppercase tracking-wide">Status</span></th>
                  <th className="w-32 px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-nav-gray/50">
                {filteredSites.map(site => (
                  <tr key={site.id} className={clsx('group hover:bg-hover-gray-lm transition-colors', selected.has(site.id) && 'bg-teal-100/20')}>
                    <td className="px-5 py-3.5"><TableCheckbox checked={selected.has(site.id)} onChange={() => toggleSelect(site.id)} /></td>
                    <td className="px-3 py-3.5">
                      <p className="text-sm font-medium text-black">{site.name}</p>
                      <p className="text-xs text-std-gray-lm">{site.state}</p>
                    </td>
                    <td className="px-3 py-3.5"><span className="text-sm text-black">{site.owner}</span></td>
                    <td className="px-3 py-3.5"><span className="text-sm text-std-gray-lm font-mono">{site.id}</span></td>
                    <td className="px-3 py-3.5"><span className="text-sm text-std-gray-lm">{site.created}</span></td>
                    <td className="px-3 py-3.5"><span className="text-sm text-black">{site.siteVisitsCount}</span></td>
                    <td className="px-3 py-3.5"><StatusBadge status={site.status} /></td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/sites/${site.id}`)}
                          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-teal-400/10 text-teal-600 hover:bg-teal-400/20 transition-colors"
                        >
                          <ArrowUpRight size={13} /> View Site
                        </button>
                        <RowMenu items={[
                          { label: 'View Site',  icon: <ArrowUpRight size={14} />, onClick: () => navigate(`/sites/${site.id}`) },
                          { label: 'Edit Site',  icon: <Pencil size={14} />,       onClick: () => {} },
                          { label: 'Delete Site',icon: <Trash2 size={14} />,       onClick: () => {}, danger: true },
                        ]} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSites.length === 0 && <EmptyState icon={<MapPin size={28} />} label="No sites found" />}
          </div>
        )}

      </div>
    </div>
  )
}

function EmptyState({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="py-16 text-center text-std-gray-lm">
      <div className="mx-auto mb-3 text-nav-gray w-fit">{icon}</div>
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}
