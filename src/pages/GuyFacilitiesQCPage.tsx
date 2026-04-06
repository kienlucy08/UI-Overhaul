import { useState, useRef, useCallback, useEffect, createContext, useContext } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle2, Flag, X, Plus, Minus,
  ChevronDown, ChevronRight, ChevronLeft, Check, Image, Camera,
  Search, CheckCheck, Loader2, AlertTriangle, Sparkles, FileImage, Trash2,
} from 'lucide-react'
import clsx from 'clsx'

// ─── AI flag types ─────────────────────────────────────────────────────────────
type AIFlagSeverity = 'error' | 'warning' | 'suggestion'
type AIFlagEntry = { issue: string; severity: AIFlagSeverity }
const AIFlagsContext = createContext<Record<string, AIFlagEntry>>({})

// ─── Types ─────────────────────────────────────────────────────────────────────
type PhotoItem   = { id: string; filename: string | null; marked: boolean; flagged: boolean }
type PhotoGroup  = { id: string; label: string; photos: PhotoItem[] }
type WirePhoto   = { id: string; filename: string }
type GuyWire     = {
  id: string
  guyLevel: string          // "1", "2", "3"
  position: 'L' | 'R' | '' // Left / Right
  size: string              // e.g. '7/8" (1-19)'
  strengthRating: string    // e.g. 'EHS'
  preformColorCode: string  // e.g. 'Green'
  measuredTension: string   // lbf as string
  tensionPropriety: 'GOOD' | 'HIGH' | 'LOW' | ''
  notes: string
  flagged: boolean
  marked: boolean
  gaugeMeasurementPhotos: WirePhoto[]
  deadEndPhotos: WirePhoto[]
  tensionPhotos: WirePhoto[]
}
type GuyCompound = {
  id: string; label: string
  anchorRadius: string | null; anchorRadiusFlagged: boolean; anchorRadiusMarked: boolean
  relativeElevation: string | null; relativeElevationFlagged: boolean; relativeElevationMarked: boolean
  photoGroups: PhotoGroup[]
  wires: GuyWire[]
}
type DeficiencyItem = { id: string; issue: string | null; severity: string; locations: string[]; notes: string; photos: PhotoItem[]; flagged: boolean; marked: boolean; collapsed: boolean }
type CatchAllItem   = { id: string; description: string; flagged: boolean; marked: boolean }
type SectionId      = 'compounds' | 'guy_photos' | 'deficiencies' | 'catch_all'
type GuySurvey      = {
  id: string; name: string; siteId: string; siteName: string; technician: string; structureType: string; customer: string
  compounds: GuyCompound[]; guyPhotos: PhotoGroup[]; deficiencies: DeficiencyItem[]; catchAll: CatchAllItem[]
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const COMPOUND_LABELS    = ['A', 'B', 'C', 'AA', 'BB', 'CC', 'AAA', 'BBB', 'CCC']
const DEFICIENCY_ISSUES  = [
  'Guy wire serving not up to standard', 'Vegetation issues',
  'Guy anchor safety wire (or equivalent) not present / not up to standard',
  'Corroded components', 'Missing or damaged hardware',
  'Guy wire tension out of specification', 'Guy wire damaged or kinked',
]
const STRENGTH_RATINGS   = ['EHS', 'Siemens-Martin', 'High Strength', 'Common Sense']
const PREFORM_COLORS     = ['Green', 'Red', 'Blue', 'Orange', 'Yellow', 'White', 'Black']
const WIRE_SIZES         = ['3/8" (1-7)', '1/2" (1-7)', '5/8" (1-7)', '3/4" (1-7)', '7/8" (1-19)', '1" (1-19)', '1-1/8" (1-19)', '1-1/4" (1-19)', '1-3/8" (1-19)']
const PHOTO_GROUP_LABELS = ['Left Photos', 'Back Photos', 'Right Photos', 'Anchor Head Photos', 'Anchor Rod Photos']
const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'compounds',    label: 'Guy Compounds' },
  { id: 'guy_photos',   label: 'Guy Photos'    },
  { id: 'deficiencies', label: 'Deficiencies'  },
  { id: 'catch_all',    label: 'Catch All'     },
]

// ─── Mock helpers ──────────────────────────────────────────────────────────────
function makePhoto(id: string, filename: string | null = null): PhotoItem {
  return { id, filename, marked: !!filename, flagged: false }
}
function makePG(id: string, label: string, photos: PhotoItem[] = []): PhotoGroup {
  return { id, label, photos }
}
function makeWire(id: string, level: string, pos: 'L' | 'R', size: string, rating: string, color: string, tension: string, prop: GuyWire['tensionPropriety']): GuyWire {
  return { id, guyLevel: level, position: pos, size, strengthRating: rating, preformColorCode: color, measuredTension: tension, tensionPropriety: prop, notes: '', flagged: false, marked: prop !== '', gaugeMeasurementPhotos: [], deadEndPhotos: [], tensionPhotos: [] }
}
function makeCompound(label: string, partial: Partial<GuyCompound> = {}): GuyCompound {
  return {
    id: `gc_${label.toLowerCase()}`, label,
    anchorRadius: null, anchorRadiusFlagged: false, anchorRadiusMarked: false,
    relativeElevation: null, relativeElevationFlagged: false, relativeElevationMarked: false,
    photoGroups: PHOTO_GROUP_LABELS.map((lbl, i) => makePG(`${label}_pg${i}`, lbl)),
    wires: [],
    ...partial,
  }
}

const initialSurvey: GuySurvey = {
  id: 'survey_guy', name: 'Guy Facilities Inspection', siteId: 'TX6100',
  siteName: 'Orange - Claybar', technician: 'Samuel Fagan',
  structureType: 'Guyed', customer: 'TowerCo',
  compounds: [
    makeCompound('A', {
      anchorRadius: '116', anchorRadiusMarked: true,
      relativeElevation: '0', relativeElevationMarked: true,
      photoGroups: PHOTO_GROUP_LABELS.map((lbl, i) => makePG(`A_pg${i}`, lbl, [
        makePhoto(`A_pg${i}_p1`, `${lbl.replace(/ /g, '_').toLowerCase()}_a_01.jpg`),
        ...(lbl === 'Anchor Head Photos' ? [makePhoto(`A_pg${i}_p2`, 'anchor_head_a_02.jpg')] : []),
      ])),
      wires: [
        makeWire('wa1', '1', 'R', '7/8" (1-19)', 'EHS', 'Green', '8160', 'GOOD'),
        makeWire('wa2', '1', 'L', '7/8" (1-19)', 'EHS', 'Green', '8460', 'GOOD'),
        makeWire('wa3', '2', 'R', '7/8" (1-19)', 'EHS', 'Green', '9240', 'HIGH'),
        makeWire('wa4', '2', 'L', '7/8" (1-19)', 'EHS', 'Green', '8840', 'GOOD'),
      ],
    }),
    makeCompound('B', {
      anchorRadius: '116', anchorRadiusMarked: true,
      relativeElevation: '0', relativeElevationFlagged: true,
      wires: [
        makeWire('wb1', '1', 'R', '7/8" (1-19)', 'EHS', 'Green', '7960', 'GOOD'),
        makeWire('wb2', '1', 'L', '7/8" (1-19)', 'EHS', 'Green', '8200', 'GOOD'),
        makeWire('wb3', '2', 'R', '7/8" (1-19)', 'EHS', 'Green', '9000', 'GOOD'),
        makeWire('wb4', '2', 'L', '7/8" (1-19)', 'EHS', 'Green', '9100', 'GOOD'),
      ],
    }),
    ...['C', 'AA', 'BB', 'CC', 'AAA', 'BBB', 'CCC'].map(l => makeCompound(l)),
  ],
  guyPhotos: [
    makePG('gp_overview',  'Overview Photos',  [makePhoto('gp_ov1', 'guy_overview_01.jpg'), makePhoto('gp_ov2', 'guy_overview_02.jpg')]),
    makePG('gp_structure', 'Structure Photos'),
  ],
  deficiencies: [
    { id: 'def01', issue: 'Guy wire serving not up to standard', severity: '2', locations: ['A','AA','AAA','B','BB','CC','C'], notes: 'Guy wire serving has not been installed. Stainless-steel wire or hose clamps are required.', photos: ['a','b','c','d'].map(x => makePhoto(`def_01_${x}`, `def_01_${x}.jpg`)), flagged: false, marked: false, collapsed: false },
    { id: 'def02', issue: 'Vegetation issues', severity: '3', locations: ['A','B','AA','BB'], notes: '', photos: ['a','b','c','d'].map(x => makePhoto(`def_02_${x}`, `def_02_${x}.jpg`)), flagged: false, marked: false, collapsed: true },
    { id: 'def03', issue: 'Guy anchor safety wire (or equivalent) not present / not up to standard', severity: '2', locations: ['A','C'], notes: '', photos: ['a','b','c','d'].map(x => makePhoto(`def_03_${x}`, `def_03_${x}.jpg`)), flagged: false, marked: false, collapsed: true },
    { id: 'def04', issue: 'Guy anchor safety wire (or equivalent) not present / not up to standard', severity: '1', locations: ['B'], notes: '', photos: [makePhoto('def_04_a', 'def_04_a.jpg')], flagged: true, marked: false, collapsed: true },
  ],
  catchAll: [],
}

// ─── Progress helpers ──────────────────────────────────────────────────────────
function getCompoundProgress(c: GuyCompound) {
  let marked = 0, total = 2
  if (c.anchorRadiusMarked) marked++
  if (c.relativeElevationMarked) marked++
  c.wires.forEach(w => { total++; if (w.marked) marked++ })
  c.photoGroups.forEach(pg => pg.photos.forEach(p => { if (p.filename) { total++; if (p.marked) marked++ } }))
  return { marked, total, pct: total > 0 ? Math.round((marked / total) * 100) : 0 }
}
function getCompoundFlagCount(c: GuyCompound) {
  return (c.anchorRadiusFlagged ? 1 : 0) + (c.relativeElevationFlagged ? 1 : 0) + c.wires.filter(w => w.flagged).length
}
function getSectionProgress(id: SectionId, s: GuySurvey) {
  if (id === 'compounds') {
    let marked = 0, total = 0
    s.compounds.forEach(c => { const p = getCompoundProgress(c); marked += p.marked; total += p.total })
    return { marked, total, pct: total > 0 ? Math.round((marked / total) * 100) : 0 }
  }
  if (id === 'guy_photos') {
    let marked = 0, total = 0
    s.guyPhotos.forEach(pg => pg.photos.forEach(p => { if (p.filename) { total++; if (p.marked) marked++ } }))
    return { marked, total, pct: total > 0 ? Math.round((marked / total) * 100) : 0 }
  }
  if (id === 'deficiencies') {
    const total = s.deficiencies.length, marked = s.deficiencies.filter(d => d.marked).length
    return { marked, total, pct: total > 0 ? Math.round((marked / total) * 100) : 0 }
  }
  const total = s.catchAll.length, marked = s.catchAll.filter(c => c.marked).length
  return { marked, total, pct: total > 0 ? Math.round((marked / total) * 100) : 0 }
}
function getSectionFlagCount(id: SectionId, s: GuySurvey) {
  if (id === 'compounds') return s.compounds.reduce((a, c) => a + getCompoundFlagCount(c), 0)
  if (id === 'deficiencies') return s.deficiencies.filter(d => d.flagged).length
  return 0
}
function getOverallProgress(s: GuySurvey) {
  let marked = 0, total = 0
  SECTIONS.forEach(sec => { const p = getSectionProgress(sec.id, s); marked += p.marked; total += p.total })
  const flagCount = s.compounds.reduce((a, c) => a + getCompoundFlagCount(c), 0) + s.deficiencies.filter(d => d.flagged).length
  return { marked, total, pct: total > 0 ? Math.round((marked / total) * 100) : 0, flagCount }
}

// ─── PhotoGroupRow ──────────────────────────────────────────────────────────────
function PhotoGroupRow({ group, onAddPhoto }: { group: PhotoGroup; onAddPhoto: () => void }) {
  return (
    <div className="py-3 px-5">
      <p className="text-xs font-semibold text-std-gray-lm mb-2">{group.label}</p>
      <div className="flex items-center gap-2 flex-wrap">
        {group.photos.map(p => (
          <div key={p.id} className="w-14 h-10 rounded-lg bg-bg-gray-lm border border-nav-gray flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0">
            <Image size={16} className="text-std-gray-lm" />
          </div>
        ))}
        <button onClick={onAddPhoto} className="w-14 h-10 rounded-lg border-2 border-dashed border-nav-gray flex items-center justify-center text-std-gray-dm hover:border-teal-400 hover:text-teal-400 hover:bg-teal-400/5 transition-colors flex-shrink-0">
          <Camera size={14} />
        </button>
      </div>
    </div>
  )
}

// ─── WirePhotoPopover ──────────────────────────────────────────────────────────
function WirePhotoPopover({
  label, photos, onAdd, onRemove, anchor,
}: {
  label: string
  photos: WirePhoto[]
  onAdd: () => void
  onRemove: (id: string) => void
  anchor: DOMRect | null
}) {
  if (!anchor) return null
  const style: React.CSSProperties = {
    position: 'fixed',
    top: anchor.bottom + 6,
    left: Math.max(8, anchor.left - 120),
    zIndex: 9999,
    width: 280,
  }
  return createPortal(
    <div style={style} className="bg-white rounded-xl border border-nav-gray shadow-xl overflow-hidden">
      <div className="px-4 py-2.5 bg-bg-gray-lm/60 border-b border-nav-gray/40 flex items-center justify-between">
        <p className="text-xs font-bold text-black">{label}</p>
        <span className="text-[10px] text-std-gray-lm">{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="p-3 space-y-2">
        {photos.map(p => (
          <div key={p.id} className="flex items-center gap-2.5 group/ph">
            <div className="w-10 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 border border-nav-gray flex items-center justify-center flex-shrink-0">
              <FileImage size={14} className="text-teal-400/60" />
            </div>
            <p className="text-xs text-black truncate flex-1 min-w-0">{p.filename}</p>
            <button
              onClick={() => onRemove(p.id)}
              className="p-1 rounded text-std-gray-lm hover:text-red-600 hover:bg-red-600/8 opacity-0 group-hover/ph:opacity-100 transition-all flex-shrink-0"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        <button
          onClick={onAdd}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border-2 border-dashed border-nav-gray text-xs text-std-gray-lm hover:border-teal-400 hover:text-teal-500 hover:bg-teal-400/5 transition-colors"
        >
          <Camera size={12} /> Add Photo
        </button>
      </div>
    </div>,
    document.body
  )
}

// ─── WireCameraCell ─────────────────────────────────────────────────────────────
function WireCameraCell({ label, photos, onAdd, onRemove, disabled }: {
  label: string
  photos: WirePhoto[]
  onAdd: () => void
  onRemove: (id: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (!btnRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function toggle() {
    if (disabled) return
    const rect = btnRef.current?.getBoundingClientRect() ?? null
    setAnchorRect(rect)
    setOpen(v => !v)
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        disabled={disabled}
        className={clsx(
          'relative p-1 rounded transition-colors flex-shrink-0',
          disabled ? 'opacity-25 cursor-not-allowed text-std-gray-dm' :
          photos.length > 0 ? 'text-teal-500 hover:bg-teal-400/8' : 'text-std-gray-dm hover:text-teal-500 hover:bg-teal-400/8'
        )}
        title={disabled ? 'Enter a value first' : `${label} (${photos.length})`}
      >
        <Image size={14} />
        {photos.length > 0 && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-teal-400 text-white text-[8px] font-bold flex items-center justify-center leading-none">
            {photos.length}
          </span>
        )}
      </button>
      {open && (
        <WirePhotoPopover
          label={label}
          photos={photos}
          onAdd={() => {
            onAdd()
          }}
          onRemove={onRemove}
          anchor={anchorRect}
        />
      )}
    </>
  )
}

// ─── WireTable ──────────────────────────────────────────────────────────────────
// Pure wire data table — measurements live above in CompoundCard
function WireTable({ wires, onUpdate, onAdd, onRemove }: {
  wires: GuyWire[]
  onUpdate: (id: string, patch: Partial<GuyWire>) => void
  onAdd: () => void
  onRemove: (id: string) => void
}) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  return (
    <>
      {/* Blue column headers */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-[#4a86c8]">
              <th className="text-left text-xs font-bold text-white px-4 py-2.5 w-16">Level</th>
              <th className="text-left text-xs font-bold text-white px-4 py-2.5 w-16">Pos.</th>
              <th className="text-left text-xs font-bold text-white px-4 py-2.5">Size (# Strands)</th>
              <th className="text-left text-xs font-bold text-white px-4 py-2.5">Strength Rating</th>
              <th className="text-left text-xs font-bold text-white px-4 py-2.5">Preform Color</th>
              <th className="text-left text-xs font-bold text-white px-4 py-2.5">Tension (lbf)</th>
              <th className="text-left text-xs font-bold text-white px-4 py-2.5">Notes</th>
              <th className="w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-nav-gray/40 bg-white">
            {wires.length === 0 && (
              <tr><td colSpan={8} className="text-center text-sm text-std-gray-dm italic py-5">No wires added yet</td></tr>
            )}
            {wires.map((wire, idx) => {
              const isPending = pendingDeleteId === wire.id
              return (
                <tr key={wire.id} className={clsx('transition-colors', isPending ? 'bg-red-600/[0.06]' : wire.marked ? 'bg-green-600/[0.02]' : 'hover:bg-hover-gray-lm/50')}>
                  {isPending ? (
                    <td colSpan={8} className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-red-600">Remove wire {idx + 1}?</span>
                        <button onClick={() => { onRemove(wire.id); setPendingDeleteId(null) }} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors">Remove</button>
                        <button onClick={() => setPendingDeleteId(null)} className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-nav-gray text-std-gray-lm hover:bg-hover-gray-lm transition-colors">Cancel</button>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-2">
                        <input value={wire.guyLevel} onChange={e => onUpdate(wire.id, { guyLevel: e.target.value })} placeholder="1"
                          className="w-12 px-2 py-1.5 text-sm bg-bg-gray-lm border border-nav-gray rounded text-black outline-none focus:border-teal-400 transition-colors text-center" />
                      </td>
                      <td className="px-4 py-2">
                        <select value={wire.position} onChange={e => onUpdate(wire.id, { position: e.target.value as GuyWire['position'] })}
                          className="px-2 py-1.5 text-sm bg-bg-gray-lm border border-nav-gray rounded text-black outline-none focus:border-teal-400 transition-colors">
                          <option value="">—</option>
                          <option value="L">L</option>
                          <option value="R">R</option>
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1">
                          <select value={wire.size} onChange={e => onUpdate(wire.id, { size: e.target.value })}
                            className="px-2 py-1.5 text-sm bg-bg-gray-lm border border-nav-gray rounded text-black outline-none focus:border-teal-400 transition-colors">
                            <option value="">— Select —</option>
                            {WIRE_SIZES.map(s => <option key={s}>{s}</option>)}
                          </select>
                          <WireCameraCell
                            label="Gauge Measurement Photos"
                            photos={wire.gaugeMeasurementPhotos}
                            disabled={!wire.size}
                            onAdd={() => onUpdate(wire.id, { gaugeMeasurementPhotos: [...wire.gaugeMeasurementPhotos, { id: `gmp_${wire.id}_${Date.now()}`, filename: `gauge_${wire.id}_${wire.gaugeMeasurementPhotos.length + 1}.jpg` }] })}
                            onRemove={pid => onUpdate(wire.id, { gaugeMeasurementPhotos: wire.gaugeMeasurementPhotos.filter(p => p.id !== pid) })}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <select value={wire.strengthRating} onChange={e => onUpdate(wire.id, { strengthRating: e.target.value })}
                          className="px-2 py-1.5 text-sm bg-bg-gray-lm border border-nav-gray rounded text-black outline-none focus:border-teal-400 transition-colors">
                          <option value="">— Select —</option>
                          {STRENGTH_RATINGS.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1">
                          <select value={wire.preformColorCode} onChange={e => onUpdate(wire.id, { preformColorCode: e.target.value })}
                            className="px-2 py-1.5 text-sm bg-bg-gray-lm border border-nav-gray rounded text-black outline-none focus:border-teal-400 transition-colors">
                            <option value="">— Select —</option>
                            {PREFORM_COLORS.map(c => <option key={c}>{c}</option>)}
                          </select>
                          <WireCameraCell
                            label="Dead-end Photos"
                            photos={wire.deadEndPhotos}
                            disabled={!wire.preformColorCode}
                            onAdd={() => onUpdate(wire.id, { deadEndPhotos: [...wire.deadEndPhotos, { id: `dep_${wire.id}_${Date.now()}`, filename: `deadend_${wire.id}_${wire.deadEndPhotos.length + 1}.jpg` }] })}
                            onRemove={pid => onUpdate(wire.id, { deadEndPhotos: wire.deadEndPhotos.filter(p => p.id !== pid) })}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1">
                          <input type="number" value={wire.measuredTension} onChange={e => onUpdate(wire.id, { measuredTension: e.target.value })} placeholder="—"
                            className="w-20 px-2 py-1.5 text-sm bg-bg-gray-lm border border-nav-gray rounded text-black placeholder-std-gray-dm outline-none focus:border-teal-400 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                          <WireCameraCell
                            label="Tension Photos"
                            photos={wire.tensionPhotos}
                            disabled={!wire.measuredTension}
                            onAdd={() => onUpdate(wire.id, { tensionPhotos: [...wire.tensionPhotos, { id: `tp_${wire.id}_${Date.now()}`, filename: `tension_${wire.id}_${wire.tensionPhotos.length + 1}.jpg` }] })}
                            onRemove={pid => onUpdate(wire.id, { tensionPhotos: wire.tensionPhotos.filter(p => p.id !== pid) })}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <input value={wire.notes} onChange={e => onUpdate(wire.id, { notes: e.target.value })} placeholder="Optional…"
                          className="w-full min-w-[80px] px-2 py-1.5 text-sm bg-bg-gray-lm border border-nav-gray rounded text-black placeholder-std-gray-dm outline-none focus:border-teal-400 transition-colors" />
                      </td>
                    </>
                  )}
                  <td className="px-3 py-2">
                    {!isPending && (
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => onUpdate(wire.id, { flagged: !wire.flagged })} className={clsx('p-1.5 rounded border transition-colors', wire.flagged ? 'text-red-600 bg-red-600/10 border-red-600/30' : 'text-std-gray-lm border-nav-gray hover:text-red-600 hover:bg-red-600/8')}><Flag size={11} /></button>
                        <button onClick={() => onUpdate(wire.id, { marked: !wire.marked })} className={clsx('p-1.5 rounded border transition-colors', wire.marked ? 'text-green-600 bg-green-600/10 border-green-600/30' : 'text-std-gray-lm border-nav-gray hover:text-green-600 hover:bg-green-600/8 hover:border-green-600/30')}><Check size={11} /></button>
                        <button onClick={() => setPendingDeleteId(wire.id)} className="p-1.5 rounded border border-nav-gray text-std-gray-lm hover:text-red-600 hover:bg-red-600/8 hover:border-red-600/30 transition-colors"><Minus size={11} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {/* Add wire footer */}
      <div className="bg-white px-5 py-2.5 border-t border-nav-gray/40 flex justify-end">
        <button onClick={onAdd} className="flex items-center gap-1.5 text-xs font-semibold text-teal-500 hover:text-teal-600 transition-colors">
          <Plus size={12} /> Add Wire
        </button>
      </div>
    </>
  )
}

// ─── CompoundDetailView ──────────────────────────────────────────────────────────
function CompoundDetailView({ compound, onUpdate }: {
  compound: GuyCompound
  onUpdate: (patch: Partial<GuyCompound>) => void
}) {
  const [photosOpen, setPhotosOpen] = useState(false)

  const addWire = () => onUpdate({
    wires: [...compound.wires, { id: `w_${compound.label}_${Date.now()}`, guyLevel: '', position: '' as GuyWire['position'], size: '', strengthRating: '', preformColorCode: '', measuredTension: '', tensionPropriety: '' as GuyWire['tensionPropriety'], notes: '', flagged: false, marked: false, gaugeMeasurementPhotos: [], deadEndPhotos: [], tensionPhotos: [] }]
  })
  const updateWire = (wireId: string, patch: Partial<GuyWire>) =>
    onUpdate({ wires: compound.wires.map(w => w.id === wireId ? { ...w, ...patch } : w) })
  const removeWire = (wireId: string) =>
    onUpdate({ wires: compound.wires.filter(w => w.id !== wireId) })

  return (
    <div className="space-y-4">
      {/* Measurements */}
      <div className="rounded-xl border border-nav-gray bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-nav-gray/40 bg-bg-gray-lm/40">
          <p className="text-[10px] font-bold text-std-gray-lm uppercase tracking-widest">Measurements</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-nav-gray/40">
          <div className="px-5 py-4">
            <label className="text-[10px] font-bold text-std-gray-lm uppercase tracking-widest block mb-2">Anchor Radius (ft)</label>
            <div className="flex items-center gap-2">
              <input type="number" value={compound.anchorRadius ?? ''}
                onChange={e => onUpdate({ anchorRadius: e.target.value || null, anchorRadiusMarked: !!e.target.value })}
                placeholder="—"
                className="w-28 px-2 py-1.5 text-sm bg-bg-gray-lm border border-nav-gray rounded text-black placeholder-std-gray-dm outline-none focus:border-teal-400 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
              <button onClick={() => onUpdate({ anchorRadiusFlagged: !compound.anchorRadiusFlagged })}
                className={clsx('p-1.5 rounded border transition-colors', compound.anchorRadiusFlagged ? 'text-red-600 bg-red-600/10 border-red-600/30' : 'text-std-gray-lm border-nav-gray hover:text-red-600 hover:bg-red-600/8')}><Flag size={12} /></button>
              <button onClick={() => onUpdate({ anchorRadiusMarked: !compound.anchorRadiusMarked })}
                className={clsx('p-1.5 rounded border transition-colors', compound.anchorRadiusMarked ? 'text-green-600 bg-green-600/10 border-green-600/30' : 'text-std-gray-lm border-nav-gray hover:text-green-600 hover:bg-green-600/8')}><Check size={12} /></button>
            </div>
          </div>
          <div className="px-5 py-4">
            <label className="text-[10px] font-bold text-std-gray-lm uppercase tracking-widest block mb-2">Relative Elevation (ft)</label>
            <div className="flex items-center gap-2">
              <input type="number" value={compound.relativeElevation ?? ''}
                onChange={e => onUpdate({ relativeElevation: e.target.value || null, relativeElevationMarked: !!e.target.value })}
                placeholder="—"
                className="w-28 px-2 py-1.5 text-sm bg-bg-gray-lm border border-nav-gray rounded text-black placeholder-std-gray-dm outline-none focus:border-teal-400 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
              <button onClick={() => onUpdate({ relativeElevationFlagged: !compound.relativeElevationFlagged })}
                className={clsx('p-1.5 rounded border transition-colors', compound.relativeElevationFlagged ? 'text-red-600 bg-red-600/10 border-red-600/30' : 'text-std-gray-lm border-nav-gray hover:text-red-600 hover:bg-red-600/8')}><Flag size={12} /></button>
              <button onClick={() => onUpdate({ relativeElevationMarked: !compound.relativeElevationMarked })}
                className={clsx('p-1.5 rounded border transition-colors', compound.relativeElevationMarked ? 'text-green-600 bg-green-600/10 border-green-600/30' : 'text-std-gray-lm border-nav-gray hover:text-green-600 hover:bg-green-600/8')}><Check size={12} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Wire table */}
      <div className="rounded-xl border border-nav-gray bg-white">
        <div className="px-5 py-3 border-b border-nav-gray/40 bg-bg-gray-lm/40 rounded-t-xl">
          <p className="text-[10px] font-bold text-std-gray-lm uppercase tracking-widest">Guy Wires</p>
        </div>
        <WireTable wires={compound.wires} onUpdate={updateWire} onAdd={addWire} onRemove={removeWire} />
      </div>

      {/* Photos */}
      <div className="rounded-xl border border-nav-gray bg-white overflow-hidden">
        <button className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-hover-gray-lm transition-colors"
          onClick={() => setPhotosOpen(o => !o)}>
          <p className="text-[10px] font-bold text-std-gray-lm uppercase tracking-widest">Photos</p>
          <ChevronDown size={13} className={clsx('text-std-gray-lm transition-transform', photosOpen && 'rotate-180')} />
        </button>
        {photosOpen && (
          <div className="border-t border-nav-gray/40 divide-y divide-nav-gray/30">
            {compound.photoGroups.map((pg, gIdx) => (
              <PhotoGroupRow key={pg.id} group={pg} onAddPhoto={() => onUpdate({
                photoGroups: compound.photoGroups.map((g, i) => i === gIdx
                  ? { ...g, photos: [...g.photos, makePhoto(`${pg.id}_p${Date.now()}`, `photo_${g.photos.length + 1}.jpg`)] }
                  : g)
              })} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── SeverityPicker ─────────────────────────────────────────────────────────────
function SeverityPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const active = ['', 'bg-green-600 border-green-600 text-white', 'bg-lime-500 border-lime-500 text-white', 'bg-amber-500 border-amber-500 text-white', 'bg-orange-500 border-orange-500 text-white', 'bg-red-600 border-red-600 text-white']
  const hover  = ['', 'hover:border-green-600 hover:text-green-600', 'hover:border-lime-500 hover:text-lime-600', 'hover:border-amber-500 hover:text-amber-600', 'hover:border-orange-500 hover:text-orange-600', 'hover:border-red-600 hover:text-red-600']
  return (
    <div className="flex items-center gap-1.5">
      {[1,2,3,4,5].map(n => (
        <button key={n} onClick={() => onChange(value === String(n) ? '' : String(n))}
          className={clsx('w-9 h-9 rounded-lg text-sm font-bold border-2 transition-colors', value === String(n) ? active[n] : `border-nav-gray bg-bg-gray-lm text-std-gray-lm ${hover[n]}`)}>{n}</button>
      ))}
    </div>
  )
}

// ─── LocationMultiSelect ────────────────────────────────────────────────────────
function LocationMultiSelect({ locations, onChange }: { locations: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const toggle = (l: string) => onChange(locations.includes(l) ? locations.filter(x => x !== l) : [...locations, l])
  return (
    <div>
      <button onClick={() => setOpen(o => !o)}
        className={clsx('w-full flex items-center justify-between px-3 py-2 bg-white border rounded-lg text-sm min-h-[38px] transition-colors', open ? 'border-teal-400/40 ring-2 ring-teal-400/10' : 'border-nav-gray hover:border-teal-300')}>
        <div className="flex-1 flex items-center gap-1 flex-wrap">
          {locations.length === 0
            ? <span className="text-std-gray-dm italic">— Select compounds —</span>
            : <>{locations.slice(0, 4).map(l => (
              <span key={l} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500 text-white">
                {l}<button onClick={e => { e.stopPropagation(); toggle(l) }}><X size={9} /></button>
              </span>
            ))}{locations.length > 4 && <span className="text-xs text-std-gray-lm font-medium">+{locations.length - 4} more</span>}</>
          }
        </div>
        <ChevronDown size={13} className={clsx('text-std-gray-lm ml-2 flex-shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="mt-1 bg-white border border-nav-gray rounded-xl shadow-sm p-2.5">
          <div className="flex flex-wrap gap-1.5">
            {COMPOUND_LABELS.map(lbl => (
              <button key={lbl} onClick={() => toggle(lbl)}
                className={clsx('px-3 py-1 rounded-full text-xs font-semibold border transition-all',
                  locations.includes(lbl) ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-indigo-500/8 text-indigo-500 border-indigo-500/25 hover:bg-indigo-500 hover:text-white')}>
                {locations.includes(lbl) && <Check size={9} className="inline mr-1 mb-0.5" />}{lbl}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── DefFieldRow ────────────────────────────────────────────────────────────────
function DefFieldRow({ label, flagged, marked, children }: {
  label: string
  flagged: boolean
  marked: boolean
  children: React.ReactNode
}) {
  const rowBg = flagged ? 'bg-red-600/5' : marked ? 'bg-green-600/[0.04]' : 'bg-white'
  return (
    <div className={clsx('transition-colors', rowBg)}>
      <div className="flex items-stretch gap-3 px-6">
        <div className={clsx('w-[3px] flex-shrink-0 rounded-full my-3 transition-colors', marked ? 'bg-green-600' : 'bg-red-600')} />
        <div className="flex-1 min-w-0 py-3">
          <p className={clsx('text-sm font-semibold mb-2', marked ? 'text-std-gray-lm' : 'text-black')}>{label}</p>
          <div className={clsx('rounded-lg border transition-all', marked ? 'border-green-600/20 bg-green-600/[0.03]' : 'border-nav-gray bg-white')}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── DeficiencyAccordion ────────────────────────────────────────────────────────
function DeficiencyAccordion({ item, onUpdate, onRemove }: {
  item: DeficiencyItem
  onUpdate: (patch: Partial<DeficiencyItem>) => void
  onRemove: () => void
}) {
  const photoCount = item.photos.filter(p => p.filename).length
  return (
    <div id={`def_${item.id}`} className={clsx(item.flagged && 'bg-red-600/[0.02]')}>
      {/* accordion header */}
      <div
        className={clsx('flex items-center justify-between px-6 py-3 cursor-pointer transition-colors', item.collapsed ? 'hover:bg-hover-gray-lm' : 'bg-hover-gray-lm/50')}
        onClick={() => onUpdate({ collapsed: !item.collapsed })}
      >
        <div className="flex items-center gap-3 min-w-0">
          <ChevronDown size={14} className={clsx('text-std-gray-lm transition-transform duration-200 flex-shrink-0', item.collapsed && '-rotate-90')} />
          <span className={clsx('text-sm font-semibold truncate', item.marked ? 'text-green-600' : 'text-black')}>{item.issue ?? 'New Deficiency'}</span>
          {item.flagged && <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-600/10 border border-red-600/20 rounded-full px-1.5 py-0.5 flex-shrink-0"><Flag size={8} />Flagged</span>}
          {photoCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-std-gray-lm bg-bg-gray-lm border border-nav-gray rounded-full px-2 py-0.5 flex-shrink-0">
              <Image size={9} />{photoCount}
            </span>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onRemove() }}
          className="p-1.5 rounded-lg text-std-gray-lm hover:text-red-600 hover:bg-red-600/8 transition-colors flex-shrink-0 ml-3"
        >
          <Minus size={13} />
        </button>
      </div>

      {/* expanded content */}
      {!item.collapsed && (
        <div className="border-t border-nav-gray/40 divide-y divide-nav-gray/30">
          {/* Issue field */}
          <DefFieldRow label="Issue" flagged={item.flagged} marked={item.marked}>
            <select value={item.issue ?? ''} onChange={e => onUpdate({ issue: e.target.value || null })}
              className="w-full px-3 py-2 text-sm bg-transparent focus:outline-none text-black">
              <option value="">— Select issue —</option>
              {DEFICIENCY_ISSUES.map(i => <option key={i}>{i}</option>)}
            </select>
          </DefFieldRow>

          {/* Severity field */}
          <DefFieldRow label="Severity" flagged={item.flagged} marked={item.marked}>
            <select value={item.severity} onChange={e => onUpdate({ severity: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-transparent focus:outline-none text-black">
              <option value="">— Select severity —</option>
              <option value="1">1 — Critical</option>
              <option value="2">2 — Moderate</option>
              <option value="3">3 — Low</option>
            </select>
          </DefFieldRow>

          {/* Compounds affected field */}
          <DefFieldRow label="Compounds Affected" flagged={item.flagged} marked={item.marked}>
            <div className="px-3 py-2">
              <LocationMultiSelect locations={item.locations} onChange={v => onUpdate({ locations: v })} />
            </div>
          </DefFieldRow>

          {/* Notes field */}
          <DefFieldRow label="Notes" flagged={item.flagged} marked={item.marked}>
            <textarea value={item.notes} onChange={e => onUpdate({ notes: e.target.value })} placeholder="Add notes…" rows={2}
              className="w-full px-3 py-2.5 text-sm bg-transparent focus:outline-none resize-none" />
          </DefFieldRow>

          {/* Photo field — QCEditorPage PhotoField style */}
          <DefFieldRow label="Photo" flagged={item.flagged} marked={item.marked}>
            <div className="px-3 py-3">
              {item.photos.filter(p => p.filename).length > 0 ? (
                <div className="space-y-2">
                  {item.photos.filter(p => p.filename).map(p => (
                    <div key={p.id} className="flex items-center gap-3">
                      <div className="w-16 h-12 rounded-lg bg-bg-gray-lm border border-nav-gray flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0">
                        <Image size={18} className="text-std-gray-lm" />
                      </div>
                      <div>
                        <p className="text-xs text-blue-400 hover:underline cursor-pointer font-medium">{p.filename}</p>
                        <button
                          onClick={() => onUpdate({ photos: [...item.photos, { id: `def_p_${Date.now()}`, filename: `photo_${item.photos.length + 1}.jpg`, marked: false, flagged: false }] })}
                          className="text-[11px] text-std-gray-lm hover:text-black mt-0.5 flex items-center gap-1">
                          <Plus size={10} /> Add another
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => onUpdate({ photos: [...item.photos, { id: `def_p_${Date.now()}`, filename: `photo_${item.photos.length + 1}.jpg`, marked: false, flagged: false }] })}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-nav-gray text-sm text-std-gray-lm hover:border-teal-400 hover:text-teal-400 hover:bg-teal-400/5 transition-colors">
                  <Plus size={14} /> Upload photo
                </button>
              )}
            </div>
          </DefFieldRow>

          {/* Flag + Mark row */}
          <div className="px-6 py-2.5 flex items-center gap-2 bg-hover-gray-lm/30">
            <button onClick={() => onUpdate({ flagged: !item.flagged })} className={clsx('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors', item.flagged ? 'text-red-600 bg-red-600/10 border-red-600/30' : 'text-std-gray-lm border-nav-gray hover:text-red-600 hover:bg-red-600/8')}><Flag size={12} />{item.flagged ? 'Flagged' : 'Flag'}</button>
            <button onClick={() => onUpdate({ marked: !item.marked })} className={clsx('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors', item.marked ? 'text-green-600 bg-green-600/10 border-green-600/30' : 'text-std-gray-lm border-nav-gray hover:text-green-600 hover:bg-green-600/8')}><Check size={12} />{item.marked ? 'Marked' : 'Mark Reviewed'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main page ──────────────────────────────────────────────────────────────────
export default function GuyFacilitiesQCPage() {
  const navigate = useNavigate()
  const [survey, setSurvey] = useState<GuySurvey>(initialSurvey)
  const [activeCompoundId, setActiveCompoundId] = useState<string | null>(null)
  const [activeDeficiencyId, setActiveDeficiencyId] = useState<string | null>(null)
  const [activeSectionIdxRaw, setActiveSectionIdxRaw] = useState(0)
  function setActiveSectionIdx(idx: number) {
    setActiveSectionIdxRaw(idx)
    if (SECTIONS[idx]?.id !== 'compounds') setActiveCompoundId(null)
  }
  const [headerCollapsed, setHeaderCollapsed] = useState(false)
  const [navSearch, setNavSearch] = useState('')
  const [rightTab, setRightTab] = useState<'flags' | 'ai' | null>(null)
  // AI analysis
  const [aiFlags, setAiFlags] = useState<Record<string, AIFlagEntry>>({})
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [aiAnalyzed, setAiAnalyzed] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [completionModalOpen, setCompletionModalOpen] = useState(false)
  const [surveyComplete, setSurveyComplete] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    setSaveState('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => { setLastSavedAt(new Date()); setSaveState('saved') }, 1500)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [survey])

  const updateCompound = useCallback((id: string, patch: Partial<GuyCompound>) =>
    setSurvey(prev => ({ ...prev, compounds: prev.compounds.map(c => c.id === id ? { ...c, ...patch } : c) })), [])
  const updateDeficiency = useCallback((id: string, patch: Partial<DeficiencyItem>) =>
    setSurvey(prev => ({ ...prev, deficiencies: prev.deficiencies.map(d => d.id === id ? { ...d, ...patch } : d) })), [])
  const removeDeficiency = useCallback((id: string) =>
    setSurvey(prev => ({ ...prev, deficiencies: prev.deficiencies.filter(d => d.id !== id) })), [])
  const addDeficiency = useCallback(() =>
    setSurvey(prev => ({ ...prev, deficiencies: [...prev.deficiencies, { id: `def_${Date.now()}`, issue: null, severity: '', locations: [], notes: '', photos: [], flagged: false, marked: false, collapsed: false }] })), [])

  function focusCompound(id: string) {
    setActiveSectionIdxRaw(0) // go to compounds section
    setActiveCompoundId(id)
  }

  const activeSectionIdx = activeSectionIdxRaw
  const activeSection = SECTIONS[activeSectionIdx]
  const { marked: totalMarked, total: totalFields, pct: overallPct, flagCount: totalFlags } = getOverallProgress(survey)
  const secProgress = getSectionProgress(activeSection.id, survey)
  const secFlags    = getSectionFlagCount(activeSection.id, survey)
  const allCurrentChecked = secProgress.total > 0 && secProgress.marked === secProgress.total
  const isFirstNav = isNavPrevDisabled()
  const isLastNav  = isNavNextDisabled()

  function goPrev() {
    if (activeSection.id === 'compounds' && activeCompoundId) {
      const idx = survey.compounds.findIndex(c => c.id === activeCompoundId)
      if (idx > 0) setActiveCompoundId(survey.compounds[idx - 1].id)
      else setActiveCompoundId(null)
    } else if (activeSectionIdx > 0) {
      setActiveSectionIdx(activeSectionIdx - 1)
    }
  }
  function goNext() {
    if (activeSection.id === 'compounds' && activeCompoundId) {
      const idx = survey.compounds.findIndex(c => c.id === activeCompoundId)
      if (idx < survey.compounds.length - 1) setActiveCompoundId(survey.compounds[idx + 1].id)
      else setActiveSectionIdx(activeSectionIdx + 1)
    } else if (activeSectionIdx < SECTIONS.length - 1) {
      setActiveSectionIdx(activeSectionIdx + 1)
    }
  }
  function getPrevLabel() {
    if (activeSection.id === 'compounds' && activeCompoundId) {
      const idx = survey.compounds.findIndex(c => c.id === activeCompoundId)
      return idx > 0 ? `Compound ${survey.compounds[idx - 1].label}` : 'All Compounds'
    }
    return activeSectionIdx > 0 ? SECTIONS[activeSectionIdx - 1].label : 'Previous'
  }
  function getNextLabel() {
    if (activeSection.id === 'compounds' && activeCompoundId) {
      const idx = survey.compounds.findIndex(c => c.id === activeCompoundId)
      return idx < survey.compounds.length - 1 ? `Compound ${survey.compounds[idx + 1].label}` : SECTIONS[1]?.label ?? 'Next'
    }
    return activeSectionIdx < SECTIONS.length - 1 ? SECTIONS[activeSectionIdx + 1].label : 'Next'
  }
  function isNavPrevDisabled() {
    if (activeSection.id === 'compounds' && activeCompoundId) return false
    return activeSectionIdx === 0
  }
  function isNavNextDisabled() {
    if (activeSection.id === 'compounds' && activeCompoundId) return false
    return activeSectionIdx === SECTIONS.length - 1
  }

  function markAllChecked() {
    if (activeSection.id === 'compounds') {
      setSurvey(prev => ({
        ...prev, compounds: prev.compounds.map(c => {
          if (activeCompoundId && c.id !== activeCompoundId) return c
          return {
            ...c,
            anchorRadiusMarked:     c.anchorRadiusFlagged    ? c.anchorRadiusMarked    : true,
            relativeElevationMarked: c.relativeElevationFlagged ? c.relativeElevationMarked : true,
            wires:       c.wires.map(w => w.flagged ? w : { ...w, marked: true }),
            photoGroups: c.photoGroups.map(pg => ({ ...pg, photos: pg.photos.map(p => p.flagged ? p : { ...p, marked: true }) })),
          }
        })
      }))
    } else if (activeSection.id === 'deficiencies') {
      setSurvey(prev => ({ ...prev, deficiencies: prev.deficiencies.map(d => d.flagged ? d : { ...d, marked: true }) }))
    } else if (activeSection.id === 'catch_all') {
      setSurvey(prev => ({ ...prev, catchAll: prev.catchAll.map(c => c.flagged ? c : { ...c, marked: true }) }))
    }
  }

  const flagList: { label: string; location: string }[] = []
  survey.compounds.forEach(c => {
    if (c.anchorRadiusFlagged)     flagList.push({ label: 'Anchor Radius',      location: `Compound ${c.label}` })
    if (c.relativeElevationFlagged) flagList.push({ label: 'Relative Elevation', location: `Compound ${c.label}` })
    c.wires.forEach(w => { if (w.flagged) flagList.push({ label: `Wire (Level ${w.guyLevel} ${w.position})`, location: `Compound ${c.label}` }) })
  })
  survey.deficiencies.forEach(d => { if (d.flagged) flagList.push({ label: d.issue ?? 'Deficiency', location: 'Deficiencies' }) })

  const filteredSections = SECTIONS.filter(s => {
    if (!navSearch) return true
    const q = navSearch.toLowerCase()
    if (s.label.toLowerCase().includes(q)) return true
    if (s.id === 'compounds') return survey.compounds.some(c => `compound ${c.label}`.toLowerCase().includes(q))
    return false
  })
  const sectionsCompleted = SECTIONS.filter(s => { const { marked, total } = getSectionProgress(s.id, survey); return total > 0 && marked === total }).length

  const allGuyFields = [
    ...survey.compounds.flatMap(c => [
      { id: `${c.id}_anchorRadius`, label: `Compound ${c.label} – Anchor Radius`, value: c.anchorRadius ?? '', flagged: c.anchorRadiusFlagged, required: true, sectionId: 'compounds' as SectionId, compoundId: c.id },
      { id: `${c.id}_relativeElevation`, label: `Compound ${c.label} – Relative Elevation`, value: c.relativeElevation ?? '', flagged: c.relativeElevationFlagged, required: true, sectionId: 'compounds' as SectionId, compoundId: c.id },
      ...c.wires.flatMap(w => [
        { id: `${w.id}_size`, label: `Compound ${c.label} Wire (Lvl ${w.guyLevel}) – Size`, value: w.size, flagged: w.flagged, required: true, sectionId: 'compounds' as SectionId, compoundId: c.id },
        { id: `${w.id}_tension`, label: `Compound ${c.label} Wire (Lvl ${w.guyLevel}) – Tension`, value: w.measuredTension, flagged: w.flagged, required: false, sectionId: 'compounds' as SectionId, compoundId: c.id },
      ]),
    ]),
    ...survey.deficiencies.map(d => ({
      id: `${d.id}_issue`, label: `Deficiency – ${d.issue ?? 'Issue'}`, value: d.issue ?? '', flagged: d.flagged, required: true, sectionId: 'deficiencies' as SectionId, compoundId: null as string | null,
    })),
  ]
  const aiIssueCount = Object.keys(aiFlags).length

  function runAIAnalysis() {
    setAiAnalyzing(true)
    setTimeout(() => {
      const newFlags: Record<string, AIFlagEntry> = {}
      allGuyFields.filter(f => f.required && !f.value).slice(0, 3).forEach(f => {
        newFlags[f.id] = { issue: 'Required field has no value. Must be completed before finalizing the survey.', severity: 'error' }
      })
      allGuyFields.filter(f => f.flagged).slice(0, 2).forEach(f => {
        if (!newFlags[f.id]) {
          newFlags[f.id] = { issue: 'Manually flagged. AI recommends cross-referencing this value against site documentation before approving.', severity: 'warning' }
        }
      })
      const candidates = allGuyFields.filter(f => !newFlags[f.id] && !f.flagged && f.value)
      if (candidates.length > 0) {
        newFlags[candidates[0].id] = { issue: `Value "${candidates[0].value}" may differ from last inspection. Verify against tower records.`, severity: 'suggestion' }
      }
      setAiFlags(newFlags)
      setAiAnalyzing(false)
      setAiAnalyzed(true)
    }, 2000)
  }

  return (
    <AIFlagsContext.Provider value={aiFlags}>
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Toolbar ── */}
      <header className="bg-white border-b border-nav-gray flex-shrink-0">
        <div className="flex items-center h-11 px-2 gap-0">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-hover-gray-lm text-std-gray-lm transition-colors flex-shrink-0"><ArrowLeft size={15} /></button>
          <div className="h-5 w-px bg-nav-gray mx-2 flex-shrink-0" />
          <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
            <h1 className="text-sm font-bold text-black">{survey.name}</h1>
            {surveyComplete
              ? <span className="hidden lg:inline-flex badge bg-green-600/10 text-green-600 border border-green-600/30 text-[10px] py-0.5">Complete</span>
              : <span className="hidden lg:inline-flex badge bg-amber-500/10 text-amber-600 border border-amber-500/30 text-[10px] py-0.5">In Progress</span>
            }
          </div>
          <div className="flex-1 flex items-center justify-center gap-3 px-3 min-w-0">
            <div className="hidden lg:flex items-center gap-2.5 min-w-0 max-w-xs w-full">
              <div className="flex-1 h-1.5 bg-bg-gray-lm rounded-full overflow-hidden">
                <div className={clsx('h-full rounded-full transition-all duration-300', overallPct === 100 ? 'bg-green-600' : 'bg-teal-300')} style={{ width: `${overallPct}%` }} />
              </div>
              <span className={clsx('text-xs font-bold w-8 flex-shrink-0', overallPct === 100 ? 'text-green-600' : 'text-teal-400')}>{overallPct}%</span>
              <span className="text-[11px] text-std-gray-lm flex-shrink-0 hidden xl:inline">{totalMarked}/{totalFields} fields</span>
            </div>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button onClick={() => setRightTab(rightTab === 'flags' ? null : 'flags')}
              className={clsx('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors', rightTab === 'flags' ? 'bg-red-600/10 text-red-600' : totalFlags > 0 ? 'text-red-600 hover:bg-red-600/8' : 'text-std-gray-lm hover:bg-hover-gray-lm')}>
              <Flag size={13} /><span className="hidden lg:inline">Flags</span>
              {totalFlags > 0 && <span className={clsx('rounded-full text-[10px] font-bold w-4 h-4 flex items-center justify-center flex-shrink-0', rightTab === 'flags' ? 'bg-red-600 text-white' : 'bg-red-600/15 text-red-600')}>{totalFlags}</span>}
            </button>
            <button
              onClick={() => setRightTab(rightTab === 'ai' ? null : 'ai')}
              className={clsx(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                rightTab === 'ai'
                  ? 'bg-purple-600/10 text-purple-600'
                  : 'text-purple-600 hover:bg-purple-600/8'
              )}
            >
              <Sparkles size={13} />
              <span className="hidden lg:inline">AI Analysis</span>
              {aiAnalyzed && aiIssueCount > 0 && (
                <span className={clsx('rounded-full text-[10px] font-bold w-4 h-4 flex items-center justify-center flex-shrink-0', rightTab === 'ai' ? 'bg-purple-600 text-white' : 'bg-purple-600/15 text-purple-600')}>
                  {aiIssueCount}
                </span>
              )}
            </button>
            <div className={clsx('hidden xl:flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all duration-300', saveState === 'saving' ? 'text-std-gray-lm' : saveState === 'saved' ? 'text-green-600' : 'text-std-gray-dm')}>
              {saveState === 'saving' && <><Loader2 size={11} className="animate-spin" /> Saving…</>}
              {saveState === 'saved' && lastSavedAt && <><CheckCheck size={11} /> {lastSavedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</>}
            </div>
            <div className="h-5 w-px bg-nav-gray mx-1.5 flex-shrink-0" />
            <button onClick={() => setCompletionModalOpen(true)} disabled={surveyComplete} className={clsx('btn-success text-xs px-3 py-1.5', surveyComplete && 'opacity-60 cursor-default')}>
              <CheckCircle2 size={13} /><span className="hidden md:inline">{surveyComplete ? 'Completed' : 'Mark Complete'}</span>
            </button>
            <button onClick={() => setHeaderCollapsed(c => !c)} className="p-1.5 rounded-lg hover:bg-hover-gray-lm text-std-gray-lm hover:text-black transition-colors ml-0.5">
              <ChevronDown size={13} className={clsx('transition-transform duration-200', headerCollapsed && 'rotate-180')} />
            </button>
          </div>
        </div>
        {!headerCollapsed && (
          <div className="flex items-center gap-3 px-4 py-1 bg-bg-gray-lm/60 border-t border-nav-gray/30 text-[11px] text-std-gray-lm">
            <span className="truncate min-w-0">{survey.siteName} · {survey.siteId} · <span className="hidden md:inline">{survey.technician}</span></span>
            <span className="ml-auto hidden sm:flex items-center gap-2.5 flex-shrink-0">
              <span><span className="font-semibold text-black">{totalMarked}</span>/{totalFields} fields</span>
              <span className="text-nav-gray">·</span>
              <span><span className="font-semibold text-black">{sectionsCompleted}</span>/{SECTIONS.length} sections</span>
            </span>
          </div>
        )}
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Sidebar ── */}
        <aside className="flex-shrink-0 w-64 bg-white border-r border-nav-gray flex flex-col overflow-hidden">
          <>
            <div className="px-4 py-3 border-b border-nav-gray bg-hover-gray-lm/40 flex-shrink-0">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[10px] font-bold text-std-gray-lm uppercase tracking-widest">Sections</p>
              </div>
              <div className="flex items-center gap-2 bg-white border border-nav-gray rounded-lg px-2.5 py-1.5">
                <Search size={12} className="text-std-gray-lm flex-shrink-0" />
                <input value={navSearch} onChange={e => setNavSearch(e.target.value)} placeholder="Filter sections…" className="bg-transparent text-xs text-black placeholder-std-gray-lm outline-none w-full" />
                {navSearch && <button onClick={() => setNavSearch('')} className="text-std-gray-lm hover:text-black transition-colors flex-shrink-0"><X size={11} /></button>}
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto py-2">
              {filteredSections.map(sec => {
                const { marked, total, pct } = getSectionProgress(sec.id, survey)
                const flags    = getSectionFlagCount(sec.id, survey)
                const isActive = sec.id === activeSection.id
                const isDone   = total > 0 && marked === total
                return (
                  <div key={sec.id}>
                    <div className={clsx('mx-1 rounded-lg transition-all border', isActive ? 'bg-teal-900/8 border-teal-400/35 shadow-sm' : 'border-transparent')}>
                      <button onClick={() => setActiveSectionIdx(SECTIONS.findIndex(s => s.id === sec.id))}
                        className={clsx('w-full text-left px-3 py-2.5 rounded-lg transition-colors', !isActive && 'hover:bg-hover-gray-lm')}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={clsx('text-xs font-semibold truncate max-w-[130px]', isActive ? 'text-teal-900' : isDone ? 'text-green-600' : 'text-black')}>{sec.label}</span>
                          <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                            {isDone && <span className="w-4 h-4 rounded-full bg-green-600/15 flex items-center justify-center"><Check size={9} className="text-green-600" /></span>}
                            {flags > 0 && <span className="flex items-center gap-0.5 text-[10px] text-red-600 bg-red-600/10 rounded-full px-1.5 py-0.5 border border-red-600/20 font-semibold"><Flag size={8} />{flags}</span>}
                            {total > 0 && <span className={clsx('text-[10px] rounded-full px-1.5 py-0.5 font-medium', isActive ? 'bg-teal-400/15 text-teal-600' : 'bg-bg-gray-lm text-std-gray-lm')}>{total}</span>}
                          </div>
                        </div>
                        {total > 0 ? (
                          <div className="space-y-1">
                            <div className="w-full h-1 bg-bg-gray-lm rounded-full overflow-hidden">
                              <div className={clsx('h-full rounded-full transition-all duration-300', pct === 100 ? 'bg-green-600' : isActive ? 'bg-teal-300' : 'bg-teal-400/60')} style={{ width: `${pct}%` }} />
                            </div>
                            <p className={clsx('text-[10px]', isActive ? 'text-teal-600' : isDone ? 'text-green-600' : 'text-std-gray-lm')}>{isDone ? 'Complete' : `${marked}/${total} checked`}</p>
                          </div>
                        ) : <p className="text-[10px] text-std-gray-dm">No fields</p>}
                      </button>
                    </div>
                    {/* Compound sub-items — always shown */}
                    {sec.id === 'compounds' && (
                      <div className="ml-4 pl-3 border-l border-teal-400/40 mt-0.5 mb-1 space-y-px">
                        {survey.compounds
                          .filter(c => !navSearch || `compound ${c.label}`.toLowerCase().includes(navSearch.toLowerCase()))
                          .map(c => {
                            const cp = getCompoundProgress(c)
                            const cf = getCompoundFlagCount(c)
                            const isSelected = activeCompoundId === c.id
                            return (
                              <div key={c.id} onClick={() => focusCompound(c.id)}
                                className={clsx('px-2 py-1.5 rounded-md cursor-pointer transition-colors', isSelected ? 'bg-teal-400/12 border border-teal-400/30' : 'hover:bg-teal-400/8')}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className={clsx('text-[11px]', cp.pct === 100 ? 'text-green-600 font-medium' : isSelected ? 'text-teal-600 font-semibold' : 'text-teal-900 font-medium')}>
                                    Compound {c.label}
                                  </span>
                                  <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                                    {cp.pct === 100 && <Check size={9} className="text-green-600" />}
                                    {cf > 0 && <span className="flex items-center gap-0.5 text-[9px] text-red-600 font-semibold"><Flag size={7} />{cf}</span>}
                                    {cp.total > 0 && <span className={clsx('text-[9px] font-medium', isSelected ? 'text-teal-600' : 'text-std-gray-dm')}>{cp.marked}/{cp.total}</span>}
                                  </div>
                                </div>
                                {cp.total > 0 && (
                                  <div className="w-full h-0.5 bg-bg-gray-lm rounded-full overflow-hidden">
                                    <div className={clsx('h-full rounded-full transition-all duration-300', cp.pct === 100 ? 'bg-green-600' : 'bg-teal-300')} style={{ width: `${cp.pct}%` }} />
                                  </div>
                                )}
                              </div>
                            )
                          })}
                      </div>
                    )}
                    {/* Deficiency sub-items — always shown */}
                    {sec.id === 'deficiencies' && survey.deficiencies.length > 0 && (
                      <div className="ml-4 pl-3 border-l border-teal-400/40 mt-0.5 mb-1 space-y-px">
                        {survey.deficiencies
                          .filter(d => !navSearch || (d.issue ?? 'New Deficiency').toLowerCase().includes(navSearch.toLowerCase()))
                          .map(d => {
                            const isSelected = activeDeficiencyId === d.id
                            return (
                              <div key={d.id} onClick={() => {
                                setActiveSectionIdxRaw(SECTIONS.findIndex(s => s.id === 'deficiencies'))
                                setActiveDeficiencyId(d.id)
                                updateDeficiency(d.id, { collapsed: false })
                                setTimeout(() => document.getElementById(`def_${d.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
                              }}
                                className={clsx('px-2 py-1.5 rounded-md cursor-pointer transition-colors', isSelected ? 'bg-teal-400/12 border border-teal-400/30' : 'hover:bg-teal-400/8')}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className={clsx('text-[11px] truncate max-w-[110px]', d.marked ? 'text-green-600 font-medium' : isSelected ? 'text-teal-600 font-semibold' : 'text-teal-900 font-medium')}>
                                    {d.issue ?? 'New Deficiency'}
                                  </span>
                                  <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                                    {d.marked && <Check size={9} className="text-green-600" />}
                                    {d.flagged && <span className="flex items-center gap-0.5 text-[9px] text-red-600 font-semibold"><Flag size={7} /></span>}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>
          </>
        </aside>

        {/* ── Content ── */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Sticky section header */}
          <div className="sticky top-0 z-10 bg-bg-gray-lm/95 backdrop-blur-sm border-b border-nav-gray/40 px-6 py-3 flex items-center justify-between flex-shrink-0">
            <div>
              {activeSection.id === 'compounds' && activeCompoundId ? (
                <div className="flex items-center gap-2">
                  <button onClick={() => setActiveCompoundId(null)} className="text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors">Guy Compounds</button>
                  <ChevronRight size={12} className="text-std-gray-dm" />
                  <h2 className="text-base font-bold text-teal-900">
                    Compound {survey.compounds.find(c => c.id === activeCompoundId)?.label}
                  </h2>
                </div>
              ) : (
                <h2 className="text-base font-bold text-teal-900">{activeSection.label}</h2>
              )}
              <p className="text-xs text-std-gray-lm mt-0.5">
                {secProgress.marked} of {secProgress.total} fields checked
                {secFlags > 0 && <span className="ml-2 text-red-600 font-semibold">· {secFlags} flagged</span>}
              </p>
            </div>
            {secProgress.total > 0 && (
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <div className="w-36 h-2 bg-nav-gray rounded-full overflow-hidden">
                  <div className={clsx('h-full rounded-full transition-all duration-500', secProgress.pct === 100 ? 'bg-green-600' : 'bg-teal-300')} style={{ width: `${secProgress.pct}%` }} />
                </div>
                <span className={clsx('text-sm font-bold w-10 text-right', secProgress.pct === 100 ? 'text-green-600' : 'text-teal-400')}>{secProgress.pct}%</span>
              </div>
            )}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto bg-bg-gray-lm/50">
            <div className="px-6 py-5">

              {/* ── Guy Compounds: list ── */}
              {activeSection.id === 'compounds' && !activeCompoundId && (
                <div className="space-y-4">
                <div className="rounded-xl border border-nav-gray bg-white overflow-hidden">
                  <div className="px-5 py-3 border-b border-nav-gray/40 bg-bg-gray-lm/40">
                    <p className="text-[10px] font-bold text-std-gray-lm uppercase tracking-widest">Site Information</p>
                  </div>
                  <div className="px-5 py-4 grid grid-cols-2 gap-x-8 gap-y-4">
                    {([
                      ['Site Name',    survey.siteName],
                      ['Site ID',      survey.siteId],
                      ['Survey Type',  survey.name],
                      ['Customer',     survey.customer],
                      ['Technician',   survey.technician],
                      ['Structure',    survey.structureType],
                    ] as [string, string][]).map(([label, value]) => (
                      <div key={label}>
                        <p className="text-[10px] font-bold text-std-gray-lm uppercase tracking-wide">{label}</p>
                        <p className="text-sm text-black mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {survey.compounds.map(c => {
                    const cp = getCompoundProgress(c)
                    const cf = getCompoundFlagCount(c)
                    const isDone = cp.total > 0 && cp.marked === cp.total
                    return (
                      <button key={c.id} onClick={() => setActiveCompoundId(c.id)}
                        className="rounded-xl border border-nav-gray bg-white hover:border-teal-400/60 hover:shadow-sm transition-all text-left p-4 flex items-center gap-4 group">
                        <div className="w-10 h-10 rounded-xl bg-teal-400/10 border border-teal-400/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-teal-600">{c.label}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={clsx('text-sm font-semibold', isDone ? 'text-green-600' : 'text-black')}>Compound {c.label}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-std-gray-lm">{cp.marked}/{cp.total} fields</span>
                            {cf > 0 && <span className="flex items-center gap-0.5 text-[10px] text-red-600 font-semibold"><Flag size={8} />{cf}</span>}
                            {c.wires.length > 0 && <span className="text-[10px] text-std-gray-lm">{c.wires.length} wire{c.wires.length > 1 ? 's' : ''}</span>}
                          </div>
                          {cp.total > 0 && (
                            <div className="mt-2 w-full h-1.5 bg-bg-gray-lm rounded-full overflow-hidden">
                              <div className={clsx('h-full rounded-full transition-all', isDone ? 'bg-green-600' : 'bg-teal-300')} style={{ width: `${cp.pct}%` }} />
                            </div>
                          )}
                        </div>
                        <ChevronRight size={14} className="text-std-gray-dm group-hover:text-teal-500 transition-colors flex-shrink-0" />
                      </button>
                    )
                  })}
                </div>
                </div>
              )}

              {/* ── Guy Compounds: detail ── */}
              {activeSection.id === 'compounds' && activeCompoundId && (() => {
                const c = survey.compounds.find(cc => cc.id === activeCompoundId)
                if (!c) return null
                return <CompoundDetailView key={c.id} compound={c} onUpdate={(patch: Partial<GuyCompound>) => updateCompound(c.id, patch)} />
              })()}

              {/* ── Guy Photos ── */}
              {activeSection.id === 'guy_photos' && (
                <div className="rounded-xl border border-nav-gray bg-white">
                  {survey.guyPhotos.length === 0 ? (
                    <div className="py-16 text-center">
                      <p className="text-sm text-std-gray-lm">No photo groups</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-nav-gray/40">
                      {survey.guyPhotos.map((pg, gIdx) => (
                        <PhotoGroupRow key={pg.id} group={pg} onAddPhoto={() => setSurvey(prev => ({
                          ...prev,
                          guyPhotos: prev.guyPhotos.map((g, i) => i === gIdx ? { ...g, photos: [...g.photos, makePhoto(`gp_p_${Date.now()}`, `photo_${g.photos.length + 1}.jpg`)] } : g)
                        }))} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Deficiencies ── */}
              {activeSection.id === 'deficiencies' && (
                <div className="card overflow-hidden">
                  {survey.deficiencies.length === 0 ? (
                    <div className="py-16 text-center">
                      <p className="text-std-gray-lm text-sm font-medium">No deficiencies recorded</p>
                      <p className="text-std-gray-dm text-xs mt-1">Add a deficiency to get started</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-nav-gray/60">
                      {survey.deficiencies.map(def => (
                        <DeficiencyAccordion
                          key={def.id}
                          item={def}
                          onUpdate={patch => updateDeficiency(def.id, patch)}
                          onRemove={() => removeDeficiency(def.id)}
                        />
                      ))}
                    </div>
                  )}
                  <div className="border-t border-nav-gray/60 px-6 py-3">
                    <button onClick={addDeficiency} className="w-full flex items-center justify-center gap-2 py-2 text-sm text-teal-400 hover:text-teal-600 hover:bg-teal-400/8 rounded-lg transition-colors font-medium">
                      <Plus size={15} /> Add Deficiency
                    </button>
                  </div>
                </div>
              )}

              {/* ── Catch All ── */}
              {activeSection.id === 'catch_all' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs text-std-gray-lm">{survey.catchAll.length} items</p>
                    <button onClick={() => setSurvey(prev => ({ ...prev, catchAll: [...prev.catchAll, { id: `ca_${Date.now()}`, description: '', flagged: false, marked: false }] }))}
                      className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"><Plus size={12} /> Add Item</button>
                  </div>
                  {survey.catchAll.length === 0 && <div className="card border-dashed py-16 text-center"><p className="text-std-gray-lm text-sm font-medium">No catch-all items</p></div>}
                  {survey.catchAll.length > 0 && (
                    <div className="card overflow-hidden divide-y divide-nav-gray/40">
                      {survey.catchAll.map(item => (
                        <div key={item.id} className="px-5 py-4">
                          <textarea value={item.description}
                            onChange={e => setSurvey(prev => ({ ...prev, catchAll: prev.catchAll.map(c => c.id === item.id ? { ...c, description: e.target.value } : c) }))}
                            placeholder="Describe the observation…" rows={2}
                            className="w-full px-3 py-2 text-sm bg-bg-gray-lm border border-nav-gray rounded-lg text-black placeholder-std-gray-dm outline-none focus:border-teal-400 transition-colors resize-none" />
                          <div className="flex items-center gap-2 mt-2">
                            <button onClick={() => setSurvey(prev => ({ ...prev, catchAll: prev.catchAll.map(c => c.id === item.id ? { ...c, marked: !c.marked } : c) }))}
                              className={clsx('flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors', item.marked ? 'text-green-600 bg-green-600/10 border-green-600/30' : 'text-std-gray-lm border-nav-gray hover:text-green-600 hover:bg-green-600/8')}>
                              <Check size={11} />{item.marked ? 'Marked' : 'Mark'}
                            </button>
                            <button onClick={() => setSurvey(prev => ({ ...prev, catchAll: prev.catchAll.filter(c => c.id !== item.id) }))}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-nav-gray text-xs font-medium text-std-gray-lm hover:text-red-600 hover:bg-red-600/8 hover:border-red-600/30 transition-colors ml-auto">
                              <Minus size={11} /> Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* ── Footer nav ── */}
          <div className="bg-white border-t border-nav-gray px-3 md:px-6 py-3 flex items-center justify-between flex-shrink-0 gap-2">
            <button onClick={goPrev} disabled={isFirstNav}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-nav-gray text-sm font-medium text-std-gray-lm hover:bg-hover-gray-lm hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0">
              <ChevronLeft size={15} /><span className="max-w-[100px] truncate hidden md:inline">{getPrevLabel()}</span>
            </button>
            <div className="flex items-center gap-2 min-w-0">
              {secFlags > 0 && (
                <span className="hidden md:flex items-center gap-1.5 text-xs text-red-600 bg-red-600/8 border border-red-600/20 rounded-full px-3 py-1.5 font-medium flex-shrink-0">
                  <Flag size={12} /> {secFlags} flag{secFlags > 1 ? 's' : ''} to review
                </span>
              )}
              <button onClick={markAllChecked} disabled={allCurrentChecked}
                className={clsx('flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0',
                  allCurrentChecked ? 'bg-green-600/10 border border-green-600/25 text-green-600 cursor-default' : 'bg-teal-400/10 border border-teal-400/30 text-teal-600 hover:bg-teal-400/20')}>
                <CheckCheck size={15} /><span className="hidden sm:inline">{allCurrentChecked ? 'Section Complete' : 'Mark All Checked'}</span>
              </button>
            </div>
            <button onClick={goNext} disabled={isLastNav}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-nav-gray text-sm font-medium text-std-gray-lm hover:bg-hover-gray-lm hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0">
              <span className="max-w-[100px] truncate hidden md:inline">{getNextLabel()}</span><ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Flags slide-over ── */}
      {rightTab === 'flags' && createPortal(
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setRightTab(null)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
          <div className="relative w-full max-w-sm bg-white shadow-2xl flex flex-col h-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-nav-gray flex-shrink-0">
              <Flag size={14} className="text-red-600" />
              <span className="text-sm font-semibold text-black">Flags</span>
              {totalFlags > 0 && <span className="rounded-full text-[10px] font-bold px-1.5 py-0.5 bg-red-600/15 text-red-600">{totalFlags}</span>}
              <button onClick={() => setRightTab(null)} className="ml-auto p-1.5 rounded-lg hover:bg-hover-gray-lm text-std-gray-lm hover:text-black transition-colors"><X size={14} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {flagList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2 p-4">
                  <CheckCheck size={20} className="text-green-600" />
                  <p className="text-sm font-medium text-black">No flags</p>
                </div>
              ) : (
                <div className="p-3 space-y-1.5">
                  {flagList.map((f, i) => (
                    <div key={i} className="p-3 rounded-lg border border-red-600/20 bg-red-600/[0.03]">
                      <p className="text-xs font-semibold text-black truncate">{f.label}</p>
                      <div className="flex items-center gap-1.5 mt-1"><Flag size={10} className="text-red-600 flex-shrink-0" /><span className="text-[11px] text-std-gray-lm">{f.location}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── AI Analysis slide-over ── */}
      {rightTab === 'ai' && createPortal(
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setRightTab(null)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
          <div className="relative w-full max-w-sm bg-white shadow-2xl flex flex-col h-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-nav-gray flex-shrink-0">
              <Sparkles size={14} className="text-purple-600" />
              <span className="text-sm font-semibold text-black">AI Analysis</span>
              <span className="badge bg-purple-600/10 text-purple-600 border border-purple-600/20 text-[10px]">Beta</span>
              {aiAnalyzed && aiIssueCount > 0 && (
                <span className="rounded-full text-[10px] font-bold px-1.5 py-0.5 bg-purple-600/15 text-purple-600">{aiIssueCount}</span>
              )}
              <button onClick={() => setRightTab(null)} className="ml-auto p-1.5 rounded-lg hover:bg-hover-gray-lm text-std-gray-lm hover:text-black transition-colors">
                <X size={14} />
              </button>
            </div>

            {!aiAnalyzed && !aiAnalyzing && (
              <div className="p-4 space-y-4">
                <p className="text-xs text-std-gray-lm leading-relaxed">
                  Analyzes the survey for missing required data, anomalies, and quality issues. Issues are flagged directly on the relevant fields in each section.
                </p>
                <button
                  onClick={runAIAnalysis}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  <Sparkles size={14} /> Run Analysis
                </button>
              </div>
            )}

            {aiAnalyzing && (
              <div className="flex flex-col items-center justify-center flex-1 gap-3 p-6">
                <div className="w-10 h-10 rounded-full bg-purple-600/10 flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-purple-600" />
                </div>
                <p className="text-sm font-medium text-black">Analyzing survey…</p>
                <p className="text-xs text-std-gray-lm text-center">Checking {totalFields} fields for issues</p>
              </div>
            )}

            {aiAnalyzed && !aiAnalyzing && (
              <>
                <div className="flex-1 overflow-y-auto">
                  {aiIssueCount === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-2 p-4">
                      <CheckCheck size={22} className="text-green-600" />
                      <p className="text-sm font-medium text-black">No issues found</p>
                      <p className="text-xs text-std-gray-lm text-center">This survey looks good!</p>
                    </div>
                  ) : (
                    <div className="p-3 space-y-2">
                      <p className="text-[11px] text-std-gray-lm font-medium uppercase tracking-wide px-1">
                        {aiIssueCount} issue{aiIssueCount !== 1 ? 's' : ''} found
                      </p>
                      {Object.entries(aiFlags).map(([fieldId, entry]) => {
                        const field = allGuyFields.find(f => f.id === fieldId)
                        if (!field) return null
                        const borderCls = entry.severity === 'error' ? 'border-red-600/25 bg-red-600/[0.04]' : entry.severity === 'warning' ? 'border-amber-500/25 bg-amber-500/[0.04]' : 'border-purple-600/20 bg-purple-600/[0.03]'
                        const iconEl = entry.severity === 'error'
                          ? <AlertTriangle size={11} className="text-red-600 flex-shrink-0 mt-0.5" />
                          : entry.severity === 'warning'
                            ? <AlertTriangle size={11} className="text-amber-600 flex-shrink-0 mt-0.5" />
                            : <Sparkles size={11} className="text-purple-600 flex-shrink-0 mt-0.5" />
                        const isHere = field.sectionId === activeSection.id && (field.compoundId == null || field.compoundId === activeCompoundId)
                        return (
                          <button
                            key={fieldId}
                            onClick={() => {
                              const sectionIdx = SECTIONS.findIndex(s => s.id === field.sectionId)
                              if (sectionIdx >= 0) {
                                setActiveSectionIdx(sectionIdx)
                                if (field.compoundId) setActiveCompoundId(field.compoundId)
                              }
                              setRightTab(null)
                            }}
                            className={clsx('w-full text-left p-3 rounded-lg border transition-colors hover:opacity-80', borderCls)}
                          >
                            <div className="flex items-start gap-2">
                              {iconEl}
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-black truncate">{field.label}</p>
                                <p className="text-[11px] text-std-gray-lm mt-0.5 leading-relaxed">{entry.issue}</p>
                                {isHere && <span className="text-[10px] text-purple-600 font-semibold mt-1 block">Currently viewing</span>}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-nav-gray flex-shrink-0">
                  <button
                    onClick={runAIAnalysis}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-purple-600/30 bg-purple-600/5 text-purple-600 text-xs font-medium hover:bg-purple-600/10 transition-colors"
                  >
                    <Sparkles size={12} /> Re-analyze
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ── Completion modal ── */}
      {completionModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className={clsx('px-6 pt-6 pb-4', totalFlags > 0 ? 'bg-amber-50' : 'bg-green-50')}>
              <div className={clsx('w-12 h-12 rounded-full flex items-center justify-center mb-3', totalFlags > 0 ? 'bg-amber-500/15' : 'bg-green-600/15')}>
                {totalFlags > 0 ? <AlertTriangle size={22} className="text-amber-600" /> : <CheckCircle2 size={22} className="text-green-600" />}
              </div>
              <h2 className="text-base font-bold text-black">{totalFlags > 0 ? 'Survey has unresolved flags' : 'Mark survey as complete?'}</h2>
              <p className="text-sm text-std-gray-lm mt-1">{totalFlags > 0 ? `${totalFlags} field${totalFlags > 1 ? 's' : ''} are flagged and need attention.` : 'This will lock the survey and generate a report-ready export.'}</p>
            </div>
            <div className="px-6 py-4 space-y-2 border-b border-nav-gray">
              <div className="flex items-center justify-between mb-1"><span className="text-xs font-semibold text-black">Fields</span><span className="text-xs text-std-gray-lm">{overallPct}% complete</span></div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-bg-gray-lm rounded-full overflow-hidden">
                  <div className={clsx('h-full rounded-full', overallPct === 100 ? 'bg-green-600' : 'bg-teal-300')} style={{ width: `${overallPct}%` }} />
                </div>
                <span className="text-xs font-semibold text-black w-20 text-right flex-shrink-0">{totalMarked}/{totalFields} checked</span>
              </div>
              {totalFields - totalMarked > 0 && <p className="text-[11px] text-amber-600 font-medium">{totalFields - totalMarked} field{totalFields - totalMarked > 1 ? 's' : ''} not yet checked</p>}
            </div>
            <div className="px-6 py-4 flex gap-2">
              <button onClick={() => setCompletionModalOpen(false)} className="btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
              <button onClick={() => { setSurveyComplete(true); setCompletionModalOpen(false) }} className="btn-success flex-1 py-2.5 text-sm flex items-center justify-center gap-2"><CheckCircle2 size={14} /> Mark Complete</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
    </AIFlagsContext.Provider>
  )
}
