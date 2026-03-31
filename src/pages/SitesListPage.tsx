import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Plus, Filter, Search, ArrowUpRight, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { mockSitesList } from '../data/mockData'
import clsx from 'clsx'

type MenuItem = { label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }

function RowMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])
  return (
    <div ref={ref} className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        className="p-1.5 rounded-lg text-std-gray-lm hover:bg-bg-gray-lm hover:text-black transition-colors"
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 bg-white border border-nav-gray rounded-xl shadow-lg py-1.5 min-w-[180px]">
          <p className="px-3 pb-1 pt-0.5 text-xs font-semibold text-std-gray-lm uppercase tracking-wide">Actions</p>
          {items.map(item => (
            <button
              key={item.label}
              onClick={e => { e.stopPropagation(); item.onClick(); setOpen(false) }}
              className={clsx(
                'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left',
                item.danger ? 'text-red-600 hover:bg-red-600/5' : 'text-black hover:bg-hover-gray-lm'
              )}
            >
              {item.icon}{item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

type SortField = 'name' | 'owner' | 'id' | 'created' | 'siteVisitsCount'
type SortDir = 'asc' | 'desc'

const statusConfig: Record<string, { bg: string; text: string; border: string }> = {
  'active':   { bg: 'bg-green-600/10', text: 'text-green-600', border: 'border-green-600/25' },
  'inactive': { bg: 'bg-bg-gray-lm',   text: 'text-std-gray-lm', border: 'border-nav-gray' },
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

function SortHeader({
  label, field, sortField, sortDir, onSort
}: {
  label: string
  field: SortField
  sortField: SortField
  sortDir: SortDir
  onSort: (f: SortField) => void
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

export default function SitesListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(s => s.id)))
  }

  const filtered = mockSitesList.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.owner.toLowerCase().includes(q)
  }).sort((a, b) => {
    const av = (a as Record<string, unknown>)[sortField]?.toString() ?? ''
    const bv = (b as Record<string, unknown>)[sortField]?.toString() ?? ''
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
  })

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="bg-white border-b border-nav-gray px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-black">Sites</h1>
            <p className="text-xs text-std-gray-lm mt-0.5">{mockSitesList.length} sites</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary text-sm">
              <Filter size={14} /> Filter
            </button>
            <button className="btn-primary text-sm">
              <Plus size={14} /> New Site
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="card overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-nav-gray flex-wrap gap-y-2 bg-hover-gray-lm/50">
            <div className="flex items-center gap-2 bg-white border border-nav-gray rounded-lg px-3 py-2 w-52">
              <Search size={14} className="text-std-gray-lm flex-shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter..."
                className="bg-transparent text-sm text-black placeholder-std-gray-lm outline-none w-full"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              {selected.size > 0 && (
                <span className="text-xs text-teal-600 font-medium bg-teal-100/50 border border-teal-300/40 rounded-lg px-2.5 py-1.5">
                  {selected.size} of {filtered.length} selected
                </span>
              )}
            </div>
          </div>

          {/* Table */}
          <table className="w-full">
            <thead>
              <tr className="border-b border-nav-gray bg-bg-gray-lm/60">
                <th className="w-10 px-5 py-3">
                  <TableCheckbox
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-3 py-3 text-left"><SortHeader label="Name"        field="name"            sortField={sortField} sortDir={sortDir} onSort={toggleSort} /></th>
                <th className="px-3 py-3 text-left"><SortHeader label="Owner"       field="owner"           sortField={sortField} sortDir={sortDir} onSort={toggleSort} /></th>
                <th className="px-3 py-3 text-left"><SortHeader label="Site ID"     field="id"              sortField={sortField} sortDir={sortDir} onSort={toggleSort} /></th>
                <th className="px-3 py-3 text-left"><SortHeader label="Created"     field="created"         sortField={sortField} sortDir={sortDir} onSort={toggleSort} /></th>
                <th className="px-3 py-3 text-left"><SortHeader label="Site Visits" field="siteVisitsCount" sortField={sortField} sortDir={sortDir} onSort={toggleSort} /></th>
                <th className="px-3 py-3 text-left">
                  <span className="text-xs font-semibold text-std-gray-lm uppercase tracking-wide">Status</span>
                </th>
                <th className="w-48 px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-nav-gray/50">
              {filtered.map(site => {
                const cfg = statusConfig[site.status] ?? statusConfig['inactive']
                return (
                  <tr
                    key={site.id}
                    className={clsx('group hover:bg-hover-gray-lm transition-colors', selected.has(site.id) && 'bg-teal-100/20')}
                  >
                    <td className="px-5 py-3.5">
                      <TableCheckbox checked={selected.has(site.id)} onChange={() => toggleSelect(site.id)} />
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="text-sm font-medium text-black">{site.name}</p>
                      <p className="text-xs text-std-gray-lm">{site.state}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="text-sm text-black">{site.owner}</span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="text-sm text-std-gray-lm font-mono">{site.id}</span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="text-sm text-std-gray-lm">{site.created}</span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="text-sm text-black">{site.siteVisitsCount}</span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={clsx('badge border text-xs', cfg.bg, cfg.text, cfg.border)}>
                        {site.status}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/sites/${site.id}`)}
                          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-teal-400/10 text-teal-600 hover:bg-teal-400/20 transition-colors"
                        >
                          <ArrowUpRight size={13} /> View Site
                        </button>
                        <RowMenu items={[
                          { label: 'View Site',   icon: <ArrowUpRight size={14} />, onClick: () => navigate(`/sites/${site.id}`) },
                          { label: 'Edit Site',   icon: <Pencil size={14} />,       onClick: () => {} },
                          { label: 'Delete Site', icon: <Trash2 size={14} />,       onClick: () => {}, danger: true },
                        ]} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-16 text-center text-std-gray-lm">
              <MapPin size={28} className="mx-auto mb-3 text-nav-gray" />
              <p className="text-sm font-medium">No sites match your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
