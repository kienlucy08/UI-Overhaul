import { useState, useRef, useCallback, useEffect, createContext } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle2, Flag, X, Plus, Minus,
  ChevronDown, ChevronRight, ChevronLeft, Check, Lock,
  Search, CheckCheck, Loader2, AlertTriangle, Sparkles,
} from 'lucide-react'
import clsx from 'clsx'

// ─── AI flag types ──────────────────────────────────────────────────────────────
type AIFlagSeverity = 'error' | 'warning' | 'suggestion'
type AIFlagEntry = { issue: string; severity: AIFlagSeverity }
const AIFlagsContext = createContext<Record<string, AIFlagEntry>>({})

// ─── Types ─────────────────────────────────────────────────────────────────────
type ObsType   = 'Direct' | 'Thru' | ''
type ShiftType = 'Left' | 'Right' | 'None' | ''
type SectionId = 'summary' | 'legs'

type Observation = {
  id: string
  elevation: string
  degrees: string
  minutes: string
  seconds: string
  shift: ShiftType
  flagged: boolean
  marked: boolean
}

type Leg = {
  id: string
  label: string
  observationDistance: string
  observationDistanceFlagged: boolean
  observationDistanceMarked: boolean
  observationType: ObsType
  observationTypeFlagged: boolean
  observationTypeMarked: boolean
  observations: Observation[]
}

type PTSurvey = {
  id: string; name: string; siteId: string; siteName: string
  technician: string; technicianEmail: string; customer: string; coordinates: string
  structureType: string; structureTypeFlagged: boolean; structureTypeMarked: boolean
  legCount: string; legCountFlagged: boolean; legCountMarked: boolean
  structureSteelHeight: string
  baseFaceWidth: string; baseFaceWidthFlagged: boolean; baseFaceWidthMarked: boolean
  elevations: string[]
  legs: Leg[]
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const STRUCTURE_TYPES = ['Self-support', 'Monopole', 'Guyed', 'Lattice']
const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'summary', label: 'Plumb & Twist' },
  { id: 'legs',    label: 'Legs'          },
]

// ─── Helpers ───────────────────────────────────────────────────────────────────
function makeObs(elevation: string, partial: Partial<Observation> = {}): Observation {
  return {
    id: `obs_${elevation}_${Math.random().toString(36).slice(2, 7)}`,
    elevation, degrees: '', minutes: '', seconds: '', shift: '',
    flagged: false, marked: false, ...partial,
  }
}

function makeLeg(label: string, elevations: string[], partial: Partial<Leg> = {}): Leg {
  return {
    id: `leg_${label.toLowerCase()}`, label,
    observationDistance: '', observationDistanceFlagged: false, observationDistanceMarked: false,
    observationType: '', observationTypeFlagged: false, observationTypeMarked: false,
    observations: elevations.map(e => makeObs(e)),
    ...partial,
  }
}

function getLegProgress(leg: Leg) {
  const items = [leg.observationDistanceMarked, leg.observationTypeMarked, ...leg.observations.map(o => o.marked)]
  const total = items.length, marked = items.filter(Boolean).length
  return { marked, total, pct: total > 0 ? Math.round((marked / total) * 100) : 0 }
}

function getLegFlagCount(leg: Leg) {
  return (leg.observationDistanceFlagged ? 1 : 0) + (leg.observationTypeFlagged ? 1 : 0) + leg.observations.filter(o => o.flagged).length
}

function getSectionProgress(id: SectionId, s: PTSurvey) {
  if (id === 'summary') {
    const items = [s.structureTypeMarked, s.legCountMarked, true /* steelHeight always marked */, s.baseFaceWidthMarked]
    return { marked: items.filter(Boolean).length, total: items.length, pct: Math.round((items.filter(Boolean).length / items.length) * 100) }
  }
  const all = s.legs.map(getLegProgress)
  const marked = all.reduce((a, p) => a + p.marked, 0)
  const total  = all.reduce((a, p) => a + p.total,  0)
  return { marked, total, pct: total > 0 ? Math.round((marked / total) * 100) : 0 }
}

function getOverallProgress(s: PTSurvey) {
  const sections  = SECTIONS.map(sec => getSectionProgress(sec.id, s))
  const marked    = sections.reduce((a, p) => a + p.marked, 0)
  const total     = sections.reduce((a, p) => a + p.total,  0)
  const flagCount = (s.structureTypeFlagged ? 1 : 0) + (s.legCountFlagged ? 1 : 0) + (s.baseFaceWidthFlagged ? 1 : 0) +
    s.legs.reduce((a, l) => a + getLegFlagCount(l), 0)
  return { marked, total, pct: total > 0 ? Math.round((marked / total) * 100) : 0, flagCount }
}

// ─── Mock data ─────────────────────────────────────────────────────────────────
const INIT_ELEVATIONS = ['138', '160', '182', '204']

const initialSurvey: PTSurvey = {
  id: 'pt_001', name: 'Plumb & Twist', siteId: 'KRNT-1', siteName: 'KRNT-1',
  technician: 'Samuel Fagan', technicianEmail: 'Samuelf@murphytower.com',
  customer: 'Des Moines Media Group', coordinates: '41.5592096, -93.57936657',
  structureType: 'Self-support', structureTypeFlagged: false, structureTypeMarked: true,
  legCount: '3', legCountFlagged: false, legCountMarked: true,
  structureSteelHeight: '204',
  baseFaceWidth: '10', baseFaceWidthFlagged: false, baseFaceWidthMarked: true,
  elevations: INIT_ELEVATIONS,
  legs: [
    makeLeg('A', INIT_ELEVATIONS, {
      observationDistance: '80', observationDistanceMarked: true,
      observationType: 'Direct', observationTypeMarked: true,
      observations: [
        makeObs('138', { degrees: '0', minutes: '0', seconds: '5',  shift: 'Left',  marked: true }),
        makeObs('160', { degrees: '0', minutes: '0', seconds: '8',  shift: 'None',  marked: true }),
        makeObs('182', { degrees: '0', minutes: '0', seconds: '3',  shift: 'Right', marked: true }),
        makeObs('204', { degrees: '0', minutes: '0', seconds: '2',  shift: 'None',  marked: true }),
      ],
    }),
    makeLeg('B', INIT_ELEVATIONS, {
      observationDistance: '80', observationDistanceMarked: true,
      observationType: 'Direct', observationTypeMarked: true,
      observations: [
        makeObs('138', { degrees: '0', minutes: '0', seconds: '4',  shift: 'None',  marked: true }),
        makeObs('160', { degrees: '0', minutes: '0', seconds: '6',  shift: 'None',  marked: true }),
        makeObs('182', { degrees: '0', minutes: '0', seconds: '9',  shift: 'Right', flagged: true, marked: true }),
        makeObs('204', { degrees: '0', minutes: '0', seconds: '1',  shift: 'None',  marked: true }),
      ],
    }),
    makeLeg('C', INIT_ELEVATIONS, {
      observationType: 'Thru',
    }),
  ],
}

// ─── ObservationsTable ──────────────────────────────────────────────────────────
function ObservationsTable({ leg, onUpdateObs }: {
  leg: Leg
  onUpdateObs: (id: string, patch: Partial<Observation>) => void
}) {
  const numInput = 'w-20 px-2 py-1.5 text-sm bg-bg-gray-lm border border-nav-gray rounded text-black outline-none focus:border-teal-400 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

  return (
    <div className="rounded-xl border border-nav-gray bg-white overflow-hidden">
      <div className="px-5 py-3 border-b border-nav-gray/40 bg-bg-gray-lm/40 flex items-center justify-between">
        <p className="text-[10px] font-bold text-std-gray-lm uppercase tracking-widest">Observations</p>
        <span className="text-[11px] text-std-gray-lm">
          {leg.observations.filter(o => o.marked).length}/{leg.observations.length} marked
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[620px]">
          <thead>
            <tr className="bg-[#4a86c8]">
              <th className="text-left text-xs font-bold text-white px-4 py-2.5 w-28">Elevation</th>
              <th className="text-left text-xs font-bold text-white px-4 py-2.5">Degrees</th>
              <th className="text-left text-xs font-bold text-white px-4 py-2.5">Minutes</th>
              <th className="text-left text-xs font-bold text-white px-4 py-2.5">Seconds</th>
              <th className="text-left text-xs font-bold text-white px-4 py-2.5 w-36">Shift</th>
              <th className="w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-nav-gray/40 bg-white">
            {leg.observations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-std-gray-lm italic">
                  No elevations defined — add elevations to start recording observations.
                </td>
              </tr>
            ) : leg.observations.map(obs => (
              <tr key={obs.id} className={clsx('transition-colors', obs.flagged ? 'bg-red-600/[0.03]' : obs.marked ? 'bg-green-600/[0.02]' : 'hover:bg-hover-gray-lm/50')}>
                <td className="px-4 py-2.5">
                  <span className="text-sm font-semibold text-black font-mono">{obs.elevation} ft</span>
                </td>
                <td className="px-4 py-2">
                  <input type="number" value={obs.degrees} onChange={e => onUpdateObs(obs.id, { degrees: e.target.value })} placeholder="0" className={numInput} />
                </td>
                <td className="px-4 py-2">
                  <input type="number" value={obs.minutes} onChange={e => onUpdateObs(obs.id, { minutes: e.target.value })} placeholder="0" className={numInput} />
                </td>
                <td className="px-4 py-2">
                  <input type="number" value={obs.seconds} onChange={e => onUpdateObs(obs.id, { seconds: e.target.value })} placeholder="0" className={numInput} />
                </td>
                <td className="px-4 py-2">
                  <select value={obs.shift} onChange={e => onUpdateObs(obs.id, { shift: e.target.value as ShiftType })}
                    className="px-2 py-1.5 text-sm bg-bg-gray-lm border border-nav-gray rounded text-black outline-none focus:border-teal-400 transition-colors">
                    <option value="">— Select —</option>
                    <option value="Left">Left</option>
                    <option value="Right">Right</option>
                    <option value="None">None</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => onUpdateObs(obs.id, { flagged: !obs.flagged })}
                      className={clsx('p-1.5 rounded border transition-colors', obs.flagged ? 'text-red-600 bg-red-600/10 border-red-600/30' : 'text-std-gray-lm border-nav-gray hover:text-red-600 hover:bg-red-600/8 hover:border-red-600/30')}>
                      <Flag size={11} />
                    </button>
                    <button onClick={() => onUpdateObs(obs.id, { marked: !obs.marked })}
                      className={clsx('p-1.5 rounded border transition-colors', obs.marked ? 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30' : 'text-std-gray-lm border-nav-gray hover:text-indigo-500 hover:bg-indigo-500/8 hover:border-indigo-300/60')}>
                      <Check size={11} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── LegDetailView ──────────────────────────────────────────────────────────────
function LegDetailView({ leg, onUpdate }: {
  leg: Leg
  onUpdate: (patch: Partial<Leg>) => void
}) {
  const updateObs = (obsId: string, patch: Partial<Observation>) =>
    onUpdate({ observations: leg.observations.map(o => o.id === obsId ? { ...o, ...patch } : o) })

  const flagBtn = (flagged: boolean, onToggle: () => void) => (
    <button onClick={onToggle}
      className={clsx('p-1.5 rounded-lg border transition-colors', flagged ? 'text-red-600 bg-red-600/10 border-red-600/30' : 'text-std-gray-lm border-nav-gray hover:text-red-600 hover:bg-red-600/8')}>
      <Flag size={12} />
    </button>
  )
  const checkBtn = (marked: boolean, onToggle: () => void) => (
    <button onClick={onToggle}
      className={clsx('p-1.5 rounded-lg border transition-colors', marked ? 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30' : 'text-std-gray-lm border-nav-gray hover:text-indigo-500 hover:bg-indigo-500/8')}>
      <Check size={12} />
    </button>
  )

  return (
    <div className="space-y-4">
      {/* Leg settings */}
      <div className="rounded-xl border border-nav-gray bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-nav-gray/40 bg-bg-gray-lm/40">
          <p className="text-[10px] font-bold text-std-gray-lm uppercase tracking-widest">Leg Settings</p>
        </div>
        <div className="divide-y divide-nav-gray/30">
          {/* Observation Distance */}
          <div className="flex items-center justify-between px-5 py-3.5 gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full flex-shrink-0 bg-red-400" />
              <span className="text-sm font-medium text-black">Observation Distance (feet)</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <input type="number" value={leg.observationDistance}
                onChange={e => onUpdate({ observationDistance: e.target.value })}
                placeholder="—"
                className="w-24 px-3 py-1.5 text-sm text-right bg-bg-gray-lm border border-nav-gray rounded-lg text-black outline-none focus:border-teal-400 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              {flagBtn(leg.observationDistanceFlagged, () => onUpdate({ observationDistanceFlagged: !leg.observationDistanceFlagged }))}
              {checkBtn(leg.observationDistanceMarked, () => onUpdate({ observationDistanceMarked: !leg.observationDistanceMarked }))}
            </div>
          </div>

          {/* Observation Type */}
          <div className="flex items-center justify-between px-5 py-3.5 gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 rounded-full flex-shrink-0 bg-red-400" />
              <span className="text-sm font-medium text-black">Observation Type</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex rounded-lg border border-nav-gray overflow-hidden bg-bg-gray-lm">
                {(['Direct', 'Thru'] as const).map(type => (
                  <button key={type}
                    onClick={() => onUpdate({ observationType: type, observationTypeMarked: true })}
                    className={clsx('px-4 py-1.5 text-sm font-medium transition-colors border-r last:border-r-0 border-nav-gray',
                      leg.observationType === type ? 'bg-teal-400/15 text-teal-600' : 'text-std-gray-lm hover:bg-hover-gray-lm hover:text-black'
                    )}>
                    {type}
                  </button>
                ))}
              </div>
              {flagBtn(leg.observationTypeFlagged, () => onUpdate({ observationTypeFlagged: !leg.observationTypeFlagged }))}
              {checkBtn(leg.observationTypeMarked, () => onUpdate({ observationTypeMarked: !leg.observationTypeMarked }))}
            </div>
          </div>
        </div>
      </div>

      {/* Observations table */}
      <ObservationsTable leg={leg} onUpdateObs={updateObs} />
    </div>
  )
}

// ─── ElevationsView ─────────────────────────────────────────────────────────────
function ElevationsView({ elevations, onUpdate }: {
  elevations: string[]
  onUpdate: (elev: string[]) => void
}) {
  const [newElev, setNewElev] = useState('')

  const addElev = () => {
    const v = newElev.trim()
    if (!v || elevations.includes(v)) return
    const sorted = [...elevations, v].sort((a, b) => parseFloat(a) - parseFloat(b))
    onUpdate(sorted)
    setNewElev('')
  }

  return (
    <div className="rounded-xl border border-nav-gray bg-white overflow-hidden">
      <div className="px-5 py-3 border-b border-nav-gray/40 bg-bg-gray-lm/40 flex items-center justify-between">
        <p className="text-[10px] font-bold text-std-gray-lm uppercase tracking-widest">Elevations</p>
        <span className="text-[11px] text-std-gray-lm">{elevations.length} defined · used in all legs</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#4a86c8]">
              <th className="text-left text-xs font-bold text-white px-4 py-2.5">Elevation (ft)</th>
              <th className="w-14" />
            </tr>
          </thead>
          <tbody className="divide-y divide-nav-gray/40 bg-white">
            {elevations.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-5 text-center text-sm text-std-gray-lm italic">No elevations defined</td>
              </tr>
            )}
            {elevations.map((elev, i) => (
              <tr key={i} className="group hover:bg-hover-gray-lm/50 transition-colors">
                <td className="px-4 py-3 text-sm font-mono font-medium text-black">{elev} ft</td>
                <td className="px-3 py-2">
                  <button onClick={() => onUpdate(elevations.filter((_, j) => j !== i))}
                    className="p-1.5 rounded border border-nav-gray text-std-gray-lm opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-600/8 hover:border-red-600/30 transition-all block ml-auto">
                    <Minus size={11} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 border-t border-nav-gray/40 flex items-center gap-2">
        <input type="number" value={newElev}
          onChange={e => setNewElev(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addElev()}
          placeholder="Add elevation (ft)…"
          className="flex-1 px-3 py-1.5 text-sm bg-bg-gray-lm border border-nav-gray rounded-lg text-black outline-none focus:border-teal-400 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button onClick={addElev}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 hover:text-indigo-600 transition-colors px-2 py-1.5 flex-shrink-0">
          <Plus size={12} /> Add
        </button>
      </div>
    </div>
  )
}

// ─── Main page ──────────────────────────────────────────────────────────────────
export default function PlumbTwistQCPage() {
  const navigate = useNavigate()
  const [survey, setSurvey] = useState<PTSurvey>(initialSurvey)
  const [activeSectionId, setActiveSectionId] = useState<SectionId>('summary')
  // null = legs overview, 'elevations' = elevations view, leg.id = leg detail
  const [activeLegView, setActiveLegView] = useState<string | null>(null)
  const [navSearch, setNavSearch] = useState('')
  const [headerCollapsed, setHeaderCollapsed] = useState(false)
  const [rightTab, setRightTab] = useState<'flags' | 'ai' | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [completionModalOpen, setCompletionModalOpen] = useState(false)
  const [surveyComplete, setSurveyComplete] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)
  const [aiFlags, setAiFlags] = useState<Record<string, AIFlagEntry>>({})
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [aiAnalyzed, setAiAnalyzed] = useState(false)

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    setSaveState('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => { setLastSavedAt(new Date()); setSaveState('saved') }, 1500)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [survey])

  const updateLeg = useCallback((legId: string, patch: Partial<Leg>) =>
    setSurvey(prev => ({ ...prev, legs: prev.legs.map(l => l.id === legId ? { ...l, ...patch } : l) })), [])

  const updateElevations = useCallback((elevations: string[]) => {
    setSurvey(prev => ({
      ...prev,
      elevations,
      // Sync each leg's observations to match the new elevation list (preserving existing data)
      legs: prev.legs.map(leg => ({
        ...leg,
        observations: elevations.map(e => leg.observations.find(o => o.elevation === e) ?? makeObs(e)),
      })),
    }))
  }, [])

  const activeLeg = (activeLegView && activeLegView !== 'elevations')
    ? survey.legs.find(l => l.id === activeLegView) ?? null
    : null

  const { marked: totalMarked, total: totalFields, pct: overallPct, flagCount: totalFlags } = getOverallProgress(survey)
  const aiIssueCount = Object.keys(aiFlags).length

  // Flag list for slide-over
  const flagList: { label: string; location: string }[] = []
  if (survey.structureTypeFlagged) flagList.push({ label: 'Structure Type', location: 'Plumb & Twist' })
  if (survey.legCountFlagged)      flagList.push({ label: 'Legs',           location: 'Plumb & Twist' })
  if (survey.baseFaceWidthFlagged) flagList.push({ label: 'Base Face Width', location: 'Plumb & Twist' })
  survey.legs.forEach(leg => {
    if (leg.observationDistanceFlagged) flagList.push({ label: 'Observation Distance', location: `Leg ${leg.label}` })
    if (leg.observationTypeFlagged)     flagList.push({ label: 'Observation Type',     location: `Leg ${leg.label}` })
    leg.observations.forEach(o => {
      if (o.flagged) flagList.push({ label: `Observation at ${o.elevation} ft`, location: `Leg ${leg.label}` })
    })
  })

  // Flat field list for AI analysis
  const allPTFields = [
    { id: 'structureType', label: 'Structure Type',  value: survey.structureType,  flagged: survey.structureTypeFlagged,  required: true,  sectionId: 'summary' as SectionId, legId: null as string | null },
    { id: 'legCount',      label: 'Legs',            value: survey.legCount,       flagged: survey.legCountFlagged,       required: true,  sectionId: 'summary' as SectionId, legId: null },
    { id: 'baseFaceWidth', label: 'Base Face Width',  value: survey.baseFaceWidth,  flagged: survey.baseFaceWidthFlagged,  required: true,  sectionId: 'summary' as SectionId, legId: null },
    ...survey.legs.flatMap(leg => [
      { id: `${leg.id}_dist`, label: `Leg ${leg.label} – Observation Distance`, value: leg.observationDistance, flagged: leg.observationDistanceFlagged, required: true,  sectionId: 'legs' as SectionId, legId: leg.id },
      { id: `${leg.id}_type`, label: `Leg ${leg.label} – Observation Type`,     value: leg.observationType,     flagged: leg.observationTypeFlagged,     required: true,  sectionId: 'legs' as SectionId, legId: leg.id },
      ...leg.observations.map(o => ({
        id: o.id, label: `Leg ${leg.label} – ${o.elevation} ft`,
        value: o.degrees || o.minutes || o.seconds || o.shift,
        flagged: o.flagged, required: false, sectionId: 'legs' as SectionId, legId: leg.id,
      })),
    ]),
  ]

  function runAIAnalysis() {
    setAiAnalyzing(true)
    setTimeout(() => {
      const newFlags: Record<string, AIFlagEntry> = {}
      allPTFields.filter(f => f.required && !f.value).slice(0, 3).forEach(f => {
        newFlags[f.id] = { issue: 'Required field has no value. Must be completed before finalizing the survey.', severity: 'error' }
      })
      allPTFields.filter(f => f.flagged).slice(0, 2).forEach(f => {
        if (!newFlags[f.id]) newFlags[f.id] = { issue: 'Manually flagged. AI recommends cross-referencing this value against site documentation before approving.', severity: 'warning' }
      })
      const candidates = allPTFields.filter(f => !newFlags[f.id] && !f.flagged && f.value)
      if (candidates.length > 0) newFlags[candidates[0].id] = { issue: `Value "${candidates[0].value}" may differ from last inspection. Verify against tower records.`, severity: 'suggestion' }
      setAiFlags(newFlags)
      setAiAnalyzing(false)
      setAiAnalyzed(true)
    }, 2000)
  }

  const sectionsCompleted = SECTIONS.filter(s => { const { marked, total } = getSectionProgress(s.id, survey); return total > 0 && marked === total }).length

  // Flat nav steps: summary → legs overview → elevations → each leg
  const navSteps: { sectionId: SectionId; legView: string | null }[] = [
    { sectionId: 'summary', legView: null },
    { sectionId: 'legs',    legView: null },
    { sectionId: 'legs',    legView: 'elevations' },
    ...survey.legs.map(l => ({ sectionId: 'legs' as SectionId, legView: l.id })),
  ]
  const currentNavIdx = navSteps.findIndex(s => s.sectionId === activeSectionId && s.legView === activeLegView)
  const isFirstNav = currentNavIdx <= 0
  const isLastNav  = currentNavIdx >= navSteps.length - 1

  function goPrev() {
    if (currentNavIdx > 0) {
      const prev = navSteps[currentNavIdx - 1]
      setActiveSectionId(prev.sectionId)
      setActiveLegView(prev.legView)
    }
  }
  function goNext() {
    if (currentNavIdx < navSteps.length - 1) {
      const next = navSteps[currentNavIdx + 1]
      setActiveSectionId(next.sectionId)
      setActiveLegView(next.legView)
    }
  }
  function getPrevLabel() {
    if (currentNavIdx <= 0) return 'Previous'
    const prev = navSteps[currentNavIdx - 1]
    if (prev.sectionId === 'summary') return 'Plumb & Twist'
    if (prev.legView === null) return 'Legs'
    if (prev.legView === 'elevations') return 'Elevations'
    const leg = survey.legs.find(l => l.id === prev.legView)
    return leg ? `Leg ${leg.label}` : 'Previous'
  }
  function getNextLabel() {
    if (currentNavIdx >= navSteps.length - 1) return 'Next'
    const next = navSteps[currentNavIdx + 1]
    if (next.sectionId === 'summary') return 'Plumb & Twist'
    if (next.legView === null) return 'Legs'
    if (next.legView === 'elevations') return 'Elevations'
    const leg = survey.legs.find(l => l.id === next.legView)
    return leg ? `Leg ${leg.label}` : 'Next'
  }

  const secProgress = (() => {
    if (activeSectionId === 'summary') return getSectionProgress('summary', survey)
    if (activeLeg) return getLegProgress(activeLeg)
    return getSectionProgress('legs', survey)
  })()
  const secFlags = (() => {
    if (activeSectionId === 'summary') return (survey.structureTypeFlagged ? 1 : 0) + (survey.legCountFlagged ? 1 : 0) + (survey.baseFaceWidthFlagged ? 1 : 0)
    if (activeLeg) return getLegFlagCount(activeLeg)
    return survey.legs.reduce((a, l) => a + getLegFlagCount(l), 0)
  })()
  const allCurrentChecked = secProgress.total > 0 && secProgress.marked === secProgress.total

  function markAllChecked() {
    if (activeSectionId === 'summary') {
      setSurvey(prev => ({
        ...prev,
        structureTypeMarked:  prev.structureTypeFlagged  ? prev.structureTypeMarked  : true,
        legCountMarked:       prev.legCountFlagged        ? prev.legCountMarked       : true,
        baseFaceWidthMarked:  prev.baseFaceWidthFlagged   ? prev.baseFaceWidthMarked  : true,
      }))
    } else if (activeLeg) {
      updateLeg(activeLeg.id, {
        observationDistanceMarked: activeLeg.observationDistanceFlagged ? activeLeg.observationDistanceMarked : true,
        observationTypeMarked:     activeLeg.observationTypeFlagged     ? activeLeg.observationTypeMarked     : true,
        observations: activeLeg.observations.map(o => o.flagged ? o : { ...o, marked: true }),
      })
    } else if (activeSectionId === 'legs') {
      setSurvey(prev => ({
        ...prev,
        legs: prev.legs.map(leg => ({
          ...leg,
          observationDistanceMarked: leg.observationDistanceFlagged ? leg.observationDistanceMarked : true,
          observationTypeMarked:     leg.observationTypeFlagged     ? leg.observationTypeMarked     : true,
          observations: leg.observations.map(o => o.flagged ? o : { ...o, marked: true }),
        })),
      }))
    }
  }

  const filteredSections = SECTIONS.filter(s => {
    if (!navSearch) return true
    const q = navSearch.toLowerCase()
    if (s.label.toLowerCase().includes(q)) return true
    if (s.id === 'legs') return survey.legs.some(l => `leg ${l.label}`.toLowerCase().includes(q)) || 'elevations'.includes(q)
    return false
  })

  // Shared field row helpers for summary section
  const flagBtn = (flagged: boolean, onToggle: () => void) => (
    <button onClick={onToggle}
      className={clsx('p-1.5 rounded-lg border transition-colors', flagged ? 'text-red-600 bg-red-600/10 border-red-600/30' : 'text-std-gray-lm border-nav-gray hover:text-red-600 hover:bg-red-600/8')}>
      <Flag size={12} />
    </button>
  )
  const checkBtn = (marked: boolean, onToggle: () => void) => (
    <button onClick={onToggle}
      className={clsx('p-1.5 rounded-lg border transition-colors', marked ? 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30' : 'text-std-gray-lm border-nav-gray hover:text-indigo-500 hover:bg-indigo-500/8')}>
      <Check size={12} />
    </button>
  )

  return (
    <AIFlagsContext.Provider value={aiFlags}>
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Toolbar ── */}
      <header className="bg-white border-b border-nav-gray flex-shrink-0">
        <div className="flex items-center h-11 px-2 gap-0">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-hover-gray-lm text-std-gray-lm transition-colors flex-shrink-0">
            <ArrowLeft size={15} />
          </button>
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
            {/* Flags */}
            <button onClick={() => setRightTab(rightTab === 'flags' ? null : 'flags')}
              className={clsx('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                rightTab === 'flags' ? 'bg-red-600/10 text-red-600' : totalFlags > 0 ? 'text-red-600 hover:bg-red-600/8' : 'text-std-gray-lm hover:bg-hover-gray-lm')}>
              <Flag size={13} /><span className="hidden lg:inline">Flags</span>
              {totalFlags > 0 && <span className={clsx('rounded-full text-[10px] font-bold w-4 h-4 flex items-center justify-center flex-shrink-0', rightTab === 'flags' ? 'bg-red-600 text-white' : 'bg-red-600/15 text-red-600')}>{totalFlags}</span>}
            </button>
            {/* AI Analysis */}
            <button onClick={() => setRightTab(rightTab === 'ai' ? null : 'ai')}
              className={clsx('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                rightTab === 'ai' ? 'bg-purple-600/10 text-purple-600' : 'text-purple-600 hover:bg-purple-600/8')}>
              <Sparkles size={13} /><span className="hidden lg:inline">AI Analysis</span>
              {aiAnalyzed && aiIssueCount > 0 && <span className={clsx('rounded-full text-[10px] font-bold w-4 h-4 flex items-center justify-center flex-shrink-0', rightTab === 'ai' ? 'bg-purple-600 text-white' : 'bg-purple-600/15 text-purple-600')}>{aiIssueCount}</span>}
            </button>
            {/* Autosave */}
            <div className={clsx('hidden xl:flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all duration-300', saveState === 'saving' ? 'text-std-gray-lm' : saveState === 'saved' ? 'text-green-600' : 'text-std-gray-dm')}>
              {saveState === 'saving' && <><Loader2 size={11} className="animate-spin" /> Saving…</>}
              {saveState === 'saved' && lastSavedAt && <><CheckCheck size={11} /> {lastSavedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</>}
            </div>
            <div className="h-5 w-px bg-nav-gray mx-1.5 flex-shrink-0" />
            <button onClick={() => setCompletionModalOpen(true)} disabled={surveyComplete}
              className={clsx('btn-success text-xs px-3 py-1.5', surveyComplete && 'opacity-60 cursor-default')}>
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
          <div className="px-4 py-3 border-b border-nav-gray bg-hover-gray-lm/40 flex-shrink-0">
            <p className="text-[10px] font-bold text-std-gray-lm uppercase tracking-widest mb-2.5">Sections</p>
            <div className="flex items-center gap-2 bg-white border border-nav-gray rounded-lg px-2.5 py-1.5">
              <Search size={12} className="text-std-gray-lm flex-shrink-0" />
              <input value={navSearch} onChange={e => setNavSearch(e.target.value)} placeholder="Filter sections…"
                className="bg-transparent text-xs text-black placeholder-std-gray-lm outline-none w-full" />
              {navSearch && <button onClick={() => setNavSearch('')} className="text-std-gray-lm hover:text-black transition-colors flex-shrink-0"><X size={11} /></button>}
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto py-2">
            {filteredSections.map(sec => {
              const { marked, total, pct } = getSectionProgress(sec.id, survey)
              const flags = sec.id === 'summary'
                ? (survey.structureTypeFlagged ? 1 : 0) + (survey.legCountFlagged ? 1 : 0) + (survey.baseFaceWidthFlagged ? 1 : 0)
                : survey.legs.reduce((a, l) => a + getLegFlagCount(l), 0)
              const isActive = sec.id === activeSectionId
              const isDone   = total > 0 && marked === total

              return (
                <div key={sec.id}>
                  <div className={clsx('mx-1 rounded-lg transition-all border', isActive ? 'bg-teal-900/8 border-teal-400/35 shadow-sm' : 'border-transparent')}>
                    <button
                      onClick={() => { setActiveSectionId(sec.id); if (sec.id !== 'legs') setActiveLegView(null) }}
                      className={clsx('w-full text-left px-3 py-2.5 rounded-lg transition-colors', !isActive && 'hover:bg-hover-gray-lm')}
                    >
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

                  {/* Legs sub-nav — always visible */}
                  {sec.id === 'legs' && (
                    <div className="ml-4 pl-3 border-l border-teal-400/40 mt-0.5 mb-1 space-y-px">
                      {(!navSearch || 'elevations'.includes(navSearch.toLowerCase())) && (
                        <button
                          onClick={() => { setActiveSectionId('legs'); setActiveLegView('elevations') }}
                          className={clsx('w-full px-2 py-1.5 rounded-md text-left text-[11px] font-medium transition-colors',
                            activeSectionId === 'legs' && activeLegView === 'elevations' ? 'bg-teal-400/12 border border-teal-400/30 text-teal-600 font-semibold' : 'text-teal-900 hover:bg-teal-400/8'
                          )}
                        >
                          Elevations
                          <span className="ml-1 text-[10px] text-std-gray-lm font-normal">({survey.elevations.length})</span>
                        </button>
                      )}
                      {survey.legs
                        .filter(l => !navSearch || `leg ${l.label}`.toLowerCase().includes(navSearch.toLowerCase()))
                        .map(leg => {
                          const lp = getLegProgress(leg)
                          const lf = getLegFlagCount(leg)
                          const isLegActive = activeSectionId === 'legs' && activeLegView === leg.id
                          return (
                            <button key={leg.id} onClick={() => { setActiveSectionId('legs'); setActiveLegView(leg.id) }}
                              className={clsx('w-full px-2 py-1.5 rounded-md text-left transition-colors',
                                isLegActive ? 'bg-teal-400/12 border border-teal-400/30' : 'hover:bg-teal-400/8'
                              )}
                            >
                              <div className="flex items-center justify-between mb-0.5">
                                <span className={clsx('text-[11px] font-medium', isLegActive ? 'text-teal-600 font-semibold' : 'text-teal-900')}>
                                  Leg {leg.label}
                                </span>
                                <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                                  {lp.marked === lp.total && lp.total > 0 && <Check size={9} className="text-green-600" />}
                                  {lf > 0 && <Flag size={7} className="text-red-600" />}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="flex-1 h-0.5 bg-bg-gray-lm rounded-full overflow-hidden">
                                  <div className={clsx('h-full rounded-full', lp.pct === 100 ? 'bg-green-600' : 'bg-teal-300')} style={{ width: `${lp.pct}%` }} />
                                </div>
                                <span className="text-[10px] text-std-gray-lm">{lp.marked}/{lp.total}</span>
                              </div>
                            </button>
                          )
                        })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </aside>

        {/* ── Content ── */}
        <div className="flex-1 flex flex-col min-h-0">

          {/* Sticky section header */}
          <div className="sticky top-0 z-10 bg-bg-gray-lm/95 backdrop-blur-sm border-b border-nav-gray/40 px-6 py-3 flex items-center justify-between flex-shrink-0">
            <div>
              {activeSectionId === 'legs' && activeLeg ? (
                <div className="flex items-center gap-2">
                  <button onClick={() => setActiveLegView(null)} className="text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors">Legs</button>
                  <ChevronRight size={12} className="text-std-gray-dm" />
                  <h2 className="text-base font-bold text-teal-900">Leg {activeLeg.label}</h2>
                </div>
              ) : activeSectionId === 'legs' && activeLegView === 'elevations' ? (
                <div className="flex items-center gap-2">
                  <button onClick={() => setActiveLegView(null)} className="text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors">Legs</button>
                  <ChevronRight size={12} className="text-std-gray-dm" />
                  <h2 className="text-base font-bold text-teal-900">Elevations</h2>
                </div>
              ) : (
                <h2 className="text-base font-bold text-teal-900">
                  {activeSectionId === 'summary' ? 'Plumb & Twist' : 'Legs'}
                </h2>
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
            <div className="px-6 py-5 space-y-4">

            {/* ── Summary ── */}
            {activeSectionId === 'summary' && (
              <>
                {/* Site info */}
                <div className="rounded-xl border border-nav-gray bg-white overflow-hidden">
                  <div className="px-5 py-3 border-b border-nav-gray/40 bg-bg-gray-lm/40">
                    <p className="text-[10px] font-bold text-std-gray-lm uppercase tracking-widest">Site Information</p>
                  </div>
                  <div className="px-5 py-4 grid grid-cols-2 gap-x-8 gap-y-4">
                    {([
                      ['Site Name',       survey.siteName],
                      ['Site ID',         survey.siteId],
                      ['Survey Type',     'Plumb & Twist'],
                      ['Customer',        survey.customer],
                      ['Technician',      survey.technician],
                      ['Coordinates',     survey.coordinates],
                    ] as [string, string][]).map(([label, value]) => (
                      <div key={label}>
                        <p className="text-[10px] font-bold text-std-gray-lm uppercase tracking-wide">{label}</p>
                        <p className="text-sm text-black mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Survey fields */}
                <div className="space-y-3">
                  {/* Structure Type */}
                  <div className={clsx('px-5 py-3.5 rounded-xl border transition-colors',
                    survey.structureTypeFlagged ? 'bg-red-600/[0.04] border-red-600/25' : survey.structureTypeMarked ? 'bg-white border-nav-gray/60 opacity-75' : 'bg-white border-nav-gray'
                  )}>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-sm font-semibold text-black">Structure Type</span>
                      <span className="text-[10px] font-semibold text-red-600 bg-red-600/8 border border-red-600/15 rounded-full px-2 py-0.5">Required</span>
                      {survey.structureTypeFlagged && <span className="text-[10px] font-semibold text-red-600 bg-red-600/10 border border-red-600/20 rounded-full px-2 py-0.5 flex items-center gap-1"><Flag size={9} /> Flagged</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <select value={survey.structureType}
                        onChange={e => setSurvey(prev => ({ ...prev, structureType: e.target.value, structureTypeMarked: true }))}
                        className="flex-1 px-3 py-2 text-sm bg-bg-gray-lm border border-nav-gray rounded-lg text-black outline-none focus:border-teal-400 transition-colors">
                        {STRUCTURE_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                      {flagBtn(survey.structureTypeFlagged, () => setSurvey(p => ({ ...p, structureTypeFlagged: !p.structureTypeFlagged })))}
                      {checkBtn(survey.structureTypeMarked, () => setSurvey(p => ({ ...p, structureTypeMarked: !p.structureTypeMarked })))}
                    </div>
                  </div>

                  {/* Legs */}
                  <div className={clsx('px-5 py-3.5 rounded-xl border transition-colors',
                    survey.legCountFlagged ? 'bg-red-600/[0.04] border-red-600/25' : survey.legCountMarked ? 'bg-white border-nav-gray/60 opacity-75' : 'bg-white border-nav-gray'
                  )}>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-sm font-semibold text-black">Legs</span>
                      <span className="text-[10px] font-semibold text-red-600 bg-red-600/8 border border-red-600/15 rounded-full px-2 py-0.5">Required</span>
                      {survey.legCountFlagged && <span className="text-[10px] font-semibold text-red-600 bg-red-600/10 border border-red-600/20 rounded-full px-2 py-0.5 flex items-center gap-1"><Flag size={9} /> Flagged</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" value={survey.legCount}
                        onChange={e => setSurvey(prev => ({ ...prev, legCount: e.target.value, legCountMarked: true }))}
                        className="flex-1 px-3 py-2 text-sm bg-bg-gray-lm border border-nav-gray rounded-lg text-black outline-none focus:border-teal-400 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      {flagBtn(survey.legCountFlagged, () => setSurvey(p => ({ ...p, legCountFlagged: !p.legCountFlagged })))}
                      {checkBtn(survey.legCountMarked, () => setSurvey(p => ({ ...p, legCountMarked: !p.legCountMarked })))}
                    </div>
                  </div>

                  {/* Structure Steel Height (locked) */}
                  <div className="px-5 py-3.5 rounded-xl border border-nav-gray bg-white opacity-60">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-black">Structure Steel Height</span>
                      <Lock size={11} className="text-std-gray-lm" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" value={survey.structureSteelHeight} readOnly
                        className="flex-1 px-3 py-2 text-sm bg-bg-gray-lm/50 border border-nav-gray rounded-lg text-std-gray-lm outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Base Face Width */}
                  <div className={clsx('px-5 py-3.5 rounded-xl border transition-colors',
                    survey.baseFaceWidthFlagged ? 'bg-red-600/[0.04] border-red-600/25' : survey.baseFaceWidthMarked ? 'bg-white border-nav-gray/60 opacity-75' : 'bg-white border-nav-gray'
                  )}>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-sm font-semibold text-black">Base Face Width</span>
                      <span className="text-[10px] font-semibold text-red-600 bg-red-600/8 border border-red-600/15 rounded-full px-2 py-0.5">Required</span>
                      {survey.baseFaceWidthFlagged && <span className="text-[10px] font-semibold text-red-600 bg-red-600/10 border border-red-600/20 rounded-full px-2 py-0.5 flex items-center gap-1"><Flag size={9} /> Flagged</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" value={survey.baseFaceWidth}
                        onChange={e => setSurvey(prev => ({ ...prev, baseFaceWidth: e.target.value, baseFaceWidthMarked: true }))}
                        className="flex-1 px-3 py-2 text-sm bg-bg-gray-lm border border-nav-gray rounded-lg text-black outline-none focus:border-teal-400 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      {flagBtn(survey.baseFaceWidthFlagged, () => setSurvey(p => ({ ...p, baseFaceWidthFlagged: !p.baseFaceWidthFlagged })))}
                      {checkBtn(survey.baseFaceWidthMarked, () => setSurvey(p => ({ ...p, baseFaceWidthMarked: !p.baseFaceWidthMarked })))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── Legs overview ── */}
            {activeSectionId === 'legs' && activeLegView === null && (
              <div className="space-y-3">
                {/* Elevations card */}
                <button onClick={() => setActiveLegView('elevations')}
                  className="w-full rounded-xl border border-nav-gray bg-white p-4 flex items-center gap-3 hover:bg-hover-gray-lm transition-colors text-left">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-black">Elevations</p>
                    <p className="text-xs text-std-gray-lm mt-0.5">
                      {survey.elevations.length === 0
                        ? 'No elevations defined'
                        : `${survey.elevations.map(e => `${e} ft`).join(' · ')}`}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-std-gray-lm flex-shrink-0" />
                </button>

                {/* Leg cards */}
                {survey.legs.map(leg => {
                  const lp = getLegProgress(leg)
                  const lf = getLegFlagCount(leg)
                  return (
                    <button key={leg.id} onClick={() => setActiveLegView(leg.id)}
                      className="w-full rounded-xl border border-nav-gray bg-white p-4 flex items-center gap-3 hover:bg-hover-gray-lm transition-colors text-left">
                      <div className="w-9 h-9 rounded-full bg-bg-gray-lm border border-nav-gray flex items-center justify-center text-sm font-bold text-black flex-shrink-0">
                        {leg.label}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-sm font-semibold text-black">Leg {leg.label}</span>
                          {leg.observationType && <span className="badge bg-bg-gray-lm border border-nav-gray text-std-gray-lm text-[10px]">{leg.observationType}</span>}
                          {lf > 0 && <span className="flex items-center gap-1 text-[10px] text-red-600 font-semibold"><Flag size={9} />{lf} flag{lf !== 1 ? 's' : ''}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-bg-gray-lm rounded-full overflow-hidden">
                            <div className={clsx('h-full rounded-full transition-all', lp.pct === 100 ? 'bg-green-600' : 'bg-teal-300')} style={{ width: `${lp.pct}%` }} />
                          </div>
                          <span className="text-[11px] text-std-gray-lm flex-shrink-0">{lp.marked}/{lp.total}</span>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-std-gray-lm flex-shrink-0" />
                    </button>
                  )
                })}
              </div>
            )}

            {/* ── Elevations view ── */}
            {activeSectionId === 'legs' && activeLegView === 'elevations' && (
              <ElevationsView elevations={survey.elevations} onUpdate={updateElevations} />
            )}

            {/* ── Leg detail ── */}
            {activeSectionId === 'legs' && activeLeg && (
              <LegDetailView
                leg={activeLeg}
                onUpdate={patch => updateLeg(activeLeg.id, patch)}
              />
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
                      <div className="flex items-center gap-1.5 mt-1">
                        <Flag size={10} className="text-red-600 flex-shrink-0" />
                        <span className="text-[11px] text-std-gray-lm">{f.location}</span>
                      </div>
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
              {aiAnalyzed && aiIssueCount > 0 && <span className="rounded-full text-[10px] font-bold px-1.5 py-0.5 bg-purple-600/15 text-purple-600">{aiIssueCount}</span>}
              <button onClick={() => setRightTab(null)} className="ml-auto p-1.5 rounded-lg hover:bg-hover-gray-lm text-std-gray-lm hover:text-black transition-colors"><X size={14} /></button>
            </div>

            {!aiAnalyzed && !aiAnalyzing && (
              <div className="p-4 space-y-4">
                <p className="text-xs text-std-gray-lm leading-relaxed">
                  Analyzes the survey for missing required data, anomalies, and quality issues. Issues are flagged directly on the relevant fields in each section.
                </p>
                <button onClick={runAIAnalysis} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors">
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
                        const field = allPTFields.find(f => f.id === fieldId)
                        if (!field) return null
                        const borderCls = entry.severity === 'error' ? 'border-red-600/25 bg-red-600/[0.04]' : entry.severity === 'warning' ? 'border-amber-500/25 bg-amber-500/[0.04]' : 'border-purple-600/20 bg-purple-600/[0.03]'
                        const iconEl = entry.severity === 'error'
                          ? <AlertTriangle size={11} className="text-red-600 flex-shrink-0 mt-0.5" />
                          : entry.severity === 'warning'
                            ? <AlertTriangle size={11} className="text-amber-600 flex-shrink-0 mt-0.5" />
                            : <Sparkles size={11} className="text-purple-600 flex-shrink-0 mt-0.5" />
                        return (
                          <button key={fieldId}
                            onClick={() => {
                              setActiveSectionId(field.sectionId)
                              if (field.legId) setActiveLegView(field.legId)
                              setRightTab(null)
                            }}
                            className={clsx('w-full text-left p-3 rounded-lg border transition-colors hover:opacity-80', borderCls)}
                          >
                            <div className="flex items-start gap-2">
                              {iconEl}
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-black truncate">{field.label}</p>
                                <p className="text-[11px] text-std-gray-lm mt-0.5 leading-relaxed">{entry.issue}</p>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-nav-gray flex-shrink-0">
                  <button onClick={runAIAnalysis} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-purple-600/30 bg-purple-600/5 text-purple-600 text-xs font-medium hover:bg-purple-600/10 transition-colors">
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
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-black">Fields</span>
                <span className="text-xs text-std-gray-lm">{overallPct}% complete</span>
              </div>
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
              <button onClick={() => { setSurveyComplete(true); setCompletionModalOpen(false) }}
                className="btn-success flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
                <CheckCircle2 size={14} /> Mark Complete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
    </AIFlagsContext.Provider>
  )
}
