import { useState, useCallback, useRef, useEffect, useContext, createContext } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2, Flag, ArrowLeft, Sparkles, X,
  CheckCheck, AlertTriangle, Info, Image, Plus, Minus,
  MoreHorizontal, ChevronRight, ChevronLeft, ChevronDown, Check, Loader2, Search
} from 'lucide-react'
import { mockSurvey, type SurveySection, type SurveyField } from '../data/mockData'
import clsx from 'clsx'

// ─── AI flag types ─────────────────────────────────────────────────────────────
type AIFlagSeverity = 'error' | 'warning' | 'suggestion'
type AIFlagEntry = { issue: string; severity: AIFlagSeverity }

// Context so FieldRow can read AI flags without prop drilling
const AIFlagsContext = createContext<Record<string, AIFlagEntry>>({})

// ─── helpers ──────────────────────────────────────────────────────────────────
function singularize(word: string): string {
  if (word.endsWith('ies')) return word.slice(0, -3) + 'y'
  if (word.endsWith('ses')) return word.slice(0, -2)
  if (word.endsWith('s')) return word.slice(0, -1)
  return word
}
function getSectionFields(section: SurveySection): SurveyField[] {
  return [
    ...section.subsections.flatMap(s => s.fields),
    ...(section.items?.flatMap(item => [
      ...item.subsections.flatMap(s => s.fields),
      ...(item.subItems?.items.flatMap(si => si.fields) ?? []),
    ]) ?? []),
  ]
}
function getSectionProgress(section: SurveySection) {
  const fields = getSectionFields(section)
  if (fields.length === 0) return { marked: 0, total: 0, pct: 0 }
  const marked = fields.filter(f => f.marked).length
  return { marked, total: fields.length, pct: Math.round((marked / fields.length) * 100) }
}
function getSectionFlagCount(section: SurveySection) {
  return getSectionFields(section).filter(f => f.flagged).length
}
function getSubsectionProgress(fields: SurveyField[]) {
  if (fields.length === 0) return { marked: 0, total: 0, pct: 0 }
  const marked = fields.filter(f => f.marked).length
  return { marked, total: fields.length, pct: Math.round((marked / fields.length) * 100) }
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function QCEditorPage() {
  const navigate = useNavigate()
  const [sections, setSections] = useState<SurveySection[]>(mockSurvey.sections)
  const [activeSectionIdx, setActiveSectionIdx] = useState(0)
  const [activeSubsectionIdx, setActiveSubsectionIdx] = useState(0)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)
  const [sectionComplete, setSectionComplete] = useState<Set<string>>(new Set())
  const [collapsedItems, setCollapsedItems] = useState<Set<string>>(new Set())
  const [collapsedSubItems, setCollapsedSubItems] = useState<Set<string>>(new Set())
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [expandedCompletedSections, setExpandedCompletedSections] = useState<Set<string>>(new Set())
  const [completionModalOpen, setCompletionModalOpen] = useState(false)
  const [surveyComplete, setSurveyComplete] = useState(false)
  // Layout
  const [headerCollapsed, setHeaderCollapsed] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [navSearch, setNavSearch] = useState('')
  // Right panel: null = collapsed icon strip, 'flags' or 'ai' = open tab
  const [rightTab, setRightTab] = useState<'flags' | 'ai' | null>(null)
  // AI analysis
  const [aiFlags, setAiFlags] = useState<Record<string, AIFlagEntry>>({})
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [aiAnalyzed, setAiAnalyzed] = useState(false)

  function toggleItem(itemId: string) {
    setCollapsedItems(prev => { const n = new Set(prev); n.has(itemId) ? n.delete(itemId) : n.add(itemId); return n })
  }
  function toggleSubItem(subItemId: string) {
    setCollapsedSubItems(prev => { const n = new Set(prev); n.has(subItemId) ? n.delete(subItemId) : n.add(subItemId); return n })
  }
  function navigateToSection(idx: number, subIdx = 0) {
    setActiveSectionIdx(idx); setActiveSubsectionIdx(subIdx); setActiveItemId(null)
  }
  function goPrev() {
    if (activeSubsectionIdx > 0) {
      setActiveSubsectionIdx(activeSubsectionIdx - 1)
    } else if (activeSectionIdx > 0) {
      const prevSec = sections[activeSectionIdx - 1]
      const prevSubCount = prevSec.subsections.length > 1 ? prevSec.subsections.length : 1
      setActiveSectionIdx(activeSectionIdx - 1)
      setActiveSubsectionIdx(prevSubCount - 1)
      setActiveItemId(null)
    }
  }
  function goNext() {
    const sec = sections[activeSectionIdx]
    const navPageCount = sec.subsections.length > 1 ? sec.subsections.length : 1
    if (activeSubsectionIdx < navPageCount - 1) {
      setActiveSubsectionIdx(activeSubsectionIdx + 1)
    } else if (activeSectionIdx < sections.length - 1) {
      setActiveSectionIdx(activeSectionIdx + 1); setActiveSubsectionIdx(0); setActiveItemId(null)
    }
  }

  const activeSection = sections[activeSectionIdx]

  const updateField = useCallback((fieldId: string, patch: Partial<SurveyField>) => {
    setSections(prev => prev.map(section => ({
      ...section,
      subsections: section.subsections.map(sub => ({
        ...sub, fields: sub.fields.map(f => f.id === fieldId ? { ...f, ...patch } : f),
      })),
      items: section.items?.map(item => ({
        ...item,
        subsections: item.subsections.map(sub => ({
          ...sub, fields: sub.fields.map(f => f.id === fieldId ? { ...f, ...patch } : f),
        })),
        subItems: item.subItems ? {
          ...item.subItems,
          items: item.subItems.items.map(si => ({
            ...si, fields: si.fields.map(f => f.id === fieldId ? { ...f, ...patch } : f),
          })),
        } : undefined,
      })),
    })))
  }, [])

  const allFields = sections.flatMap(getSectionFields)
  const totalMarked = allFields.filter(f => f.marked).length
  const totalFields = allFields.length
  const overallPct = totalFields > 0 ? Math.round((totalMarked / totalFields) * 100) : 0
  const totalFlags = allFields.filter(f => f.flagged).length

  const sectionsWithFields = sections.filter(s => getSectionFields(s).length > 0)
  const sectionsCompleted = sectionsWithFields.filter(s => {
    const { marked, total } = getSectionProgress(s)
    return total > 0 && marked === total
  }).length
  const totalSections = sectionsWithFields.length

  const flaggedBySection = sections.flatMap((section, sectionIdx) => {
    const results: { field: SurveyField; sectionIdx: number; subsectionIdx: number; locationLabel: string }[] = []
    section.subsections.forEach((sub, subIdx) => {
      sub.fields.filter(f => f.flagged).forEach(f => {
        results.push({ field: f, sectionIdx, subsectionIdx: subIdx, locationLabel: section.subsections.length > 1 ? `${section.title} › ${sub.title}` : section.title })
      })
    })
    section.items?.forEach(item => {
      item.subsections.forEach(sub => {
        sub.fields.filter(f => f.flagged).forEach(f => {
          results.push({ field: f, sectionIdx, subsectionIdx: 0, locationLabel: `${section.title} › ${item.label}` })
        })
      })
      item.subItems?.items.forEach(si => {
        si.fields.filter(f => f.flagged).forEach(f => {
          results.push({ field: f, sectionIdx, subsectionIdx: 0, locationLabel: `${section.title} › ${item.label} › ${si.label}` })
        })
      })
    })
    return results
  })

  // Autosave
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    setSaveState('saving')
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => { setLastSavedAt(new Date()); setSaveState('saved') }, 1500)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [sections])

  function markSectionComplete(sectionId: string) {
    const sec = sections.find(s => s.id === sectionId)
    if (!sec) return
    const subNavActive = sec.subsections.length > 1
    if (subNavActive) {
      const targetSubId = sec.subsections[activeSubsectionIdx]?.id
      setSections(prev => prev.map(section => {
        if (section.id !== sectionId) return section
        return { ...section, subsections: section.subsections.map(sub => sub.id === targetSubId ? { ...sub, fields: sub.fields.map(f => f.flagged ? f : { ...f, marked: true }) } : sub) }
      }))
      setTimeout(() => goNext(), 300)
    } else {
      setSections(prev => prev.map(section => {
        if (section.id !== sectionId) return section
        return {
          ...section,
          subsections: section.subsections.map(sub => ({ ...sub, fields: sub.fields.map(f => f.flagged ? f : { ...f, marked: true }) })),
          items: section.items?.map(item => ({ ...item, subsections: item.subsections.map(sub => ({ ...sub, fields: sub.fields.map(f => f.flagged ? f : { ...f, marked: true }) })) })),
        }
      }))
      setSectionComplete(prev => new Set([...prev, sectionId]))
      if (activeSectionIdx < sections.length - 1) setTimeout(() => goNext(), 300)
    }
  }

  // Find which section/subsection contains a field (for AI panel navigation)
  function findFieldLocation(fieldId: string): { sectionIdx: number; subsectionIdx: number } | null {
    for (let si = 0; si < sections.length; si++) {
      const section = sections[si]
      for (let subi = 0; subi < section.subsections.length; subi++) {
        if (section.subsections[subi].fields.some(f => f.id === fieldId)) return { sectionIdx: si, subsectionIdx: subi }
      }
      if (section.items) {
        for (const item of section.items) {
          for (const sub of item.subsections) {
            if (sub.fields.some(f => f.id === fieldId)) return { sectionIdx: si, subsectionIdx: 0 }
          }
          if (item.subItems) {
            for (const si_item of item.subItems.items) {
              if (si_item.fields.some(f => f.id === fieldId)) return { sectionIdx: si, subsectionIdx: 0 }
            }
          }
        }
      }
    }
    return null
  }

  // AI Analysis — flags required-empty fields, user-flagged fields, and adds a mock suggestion
  function runAIAnalysis() {
    setAiAnalyzing(true)
    setTimeout(() => {
      const newFlags: Record<string, AIFlagEntry> = {}
      // Required fields with no value → error
      allFields.filter(f => f.required && !f.value).slice(0, 3).forEach(f => {
        newFlags[f.id] = { issue: 'Required field has no value. Must be completed before finalizing the survey.', severity: 'error' }
      })
      // User-flagged fields → add AI context warning
      allFields.filter(f => f.flagged).slice(0, 2).forEach(f => {
        if (!newFlags[f.id]) {
          newFlags[f.id] = { issue: 'Manually flagged. AI recommends cross-referencing this value against site documentation before approving.', severity: 'warning' }
        }
      })
      // One mock suggestion on a field that has a value
      const candidates = allFields.filter(f => !newFlags[f.id] && !f.flagged && f.value)
      if (candidates.length > 0) {
        newFlags[candidates[0].id] = { issue: `Value "${candidates[0].value}" may differ from last inspection. Verify against tower records.`, severity: 'suggestion' }
      }
      setAiFlags(newFlags)
      setAiAnalyzing(false)
      setAiAnalyzed(true)
    }, 2000)
  }

  const { marked: sMarked, total: sTotal, pct: sPct } = getSectionProgress(activeSection)
  const sFlags = getSectionFlagCount(activeSection)
  const hasSubsectionNav = activeSection.subsections.length > 1
  const navPageCount = hasSubsectionNav ? activeSection.subsections.length : 1
  const activeSub = hasSubsectionNav ? activeSection.subsections[activeSubsectionIdx] : null
  const activeSubFields = activeSub ? activeSub.fields : getSectionFields(activeSection)
  const subMarked = activeSubFields.filter(f => f.marked).length
  const subTotal = activeSubFields.length
  const subPct = subTotal > 0 ? Math.round((subMarked / subTotal) * 100) : 0
  const subFlags = activeSubFields.filter(f => f.flagged).length
  const allSubFieldsChecked = subTotal > 0 && subMarked === subTotal

  const isFirstNav = activeSectionIdx === 0 && activeSubsectionIdx === 0
  const isLastNav = activeSectionIdx === sections.length - 1 && activeSubsectionIdx === navPageCount - 1

  function getPrevLabel() {
    if (activeSubsectionIdx > 0) return activeSection.subsections[activeSubsectionIdx - 1].title
    if (activeSectionIdx > 0) return sections[activeSectionIdx - 1].title
    return 'Previous'
  }
  function getNextLabel() {
    if (activeSubsectionIdx < navPageCount - 1) return activeSection.subsections[activeSubsectionIdx + 1].title
    if (activeSectionIdx < sections.length - 1) return sections[activeSectionIdx + 1].title
    return 'Next'
  }

  // Nav search filtering — preserves original index
  const filteredNavSections = sections
    .map((section, idx) => ({ section, idx }))
    .filter(({ section }) => {
      if (!navSearch) return true
      const q = navSearch.toLowerCase()
      return section.title.toLowerCase().includes(q) ||
        section.subsections.some(s => s.title.toLowerCase().includes(q)) ||
        section.items?.some(i => i.label.toLowerCase().includes(q))
    })

  const aiIssueCount = Object.keys(aiFlags).length

  return (
    <AIFlagsContext.Provider value={aiFlags}>
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Toolbar ── */}
      <header className="bg-white border-b border-nav-gray flex-shrink-0">
        {/* Main toolbar row */}
        <div className="flex items-center h-11 px-2 gap-0">

          {/* ── Left: back + title ── */}
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-hover-gray-lm text-std-gray-lm transition-colors flex-shrink-0">
            <ArrowLeft size={15} />
          </button>
          <div className="h-5 w-px bg-nav-gray mx-2 flex-shrink-0" />
          <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
            <h1 className="text-sm font-bold text-black">{mockSurvey.name}</h1>
            <span className="hidden lg:inline-flex badge bg-amber-500/10 text-amber-600 border border-amber-500/30 text-[10px] flex-shrink-0 py-0.5">In Progress</span>
          </div>

          {/* ── Center: progress ── */}
          <div className="flex-1 flex items-center justify-center gap-3 px-3 min-w-0">
            <div className="hidden lg:flex items-center gap-2.5 min-w-0 max-w-xs w-full">
              <div className="flex-1 h-1.5 bg-bg-gray-lm rounded-full overflow-hidden">
                <div className={clsx('h-full rounded-full transition-all duration-300', overallPct === 100 ? 'bg-green-600' : 'bg-teal-300')} style={{ width: `${overallPct}%` }} />
              </div>
              <span className={clsx('text-xs font-bold w-8 flex-shrink-0', overallPct === 100 ? 'text-green-600' : 'text-teal-400')}>{overallPct}%</span>
              <span className="text-[11px] text-std-gray-lm flex-shrink-0 hidden xl:inline">{totalMarked}/{totalFields} fields</span>
            </div>
          </div>

          {/* ── Right: tools ── */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {/* Flags */}
            <button
              onClick={() => setRightTab(rightTab === 'flags' ? null : 'flags')}
              className={clsx(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                rightTab === 'flags'
                  ? 'bg-red-600/10 text-red-600'
                  : totalFlags > 0
                    ? 'text-red-600 hover:bg-red-600/8'
                    : 'text-std-gray-lm hover:bg-hover-gray-lm'
              )}
            >
              <Flag size={13} />
              <span className="hidden lg:inline">Flags</span>
              {totalFlags > 0 && (
                <span className={clsx('rounded-full text-[10px] font-bold w-4 h-4 flex items-center justify-center flex-shrink-0', rightTab === 'flags' ? 'bg-red-600 text-white' : 'bg-red-600/15 text-red-600')}>
                  {totalFlags}
                </span>
              )}
            </button>

            {/* AI Analysis */}
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

            {/* Autosave — only at xl where there's room */}
            <div className={clsx(
              'hidden xl:flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all duration-300',
              saveState === 'saving' ? 'text-std-gray-lm' : saveState === 'saved' ? 'text-green-600' : 'text-std-gray-dm'
            )}>
              {saveState === 'saving' && <><Loader2 size={11} className="animate-spin" /> Saving…</>}
              {saveState === 'saved' && lastSavedAt && <><CheckCheck size={11} /> {lastSavedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</>}
            </div>

            <div className="h-5 w-px bg-nav-gray mx-1.5 flex-shrink-0" />

            <button
              onClick={() => setCompletionModalOpen(true)}
              disabled={surveyComplete}
              className={clsx('btn-success text-xs px-3 py-1.5', surveyComplete && 'opacity-60 cursor-default')}
            >
              <CheckCircle2 size={13} />
              <span className="hidden md:inline">{surveyComplete ? 'Completed' : 'Mark Complete'}</span>
            </button>

            <button
              onClick={() => setHeaderCollapsed(c => !c)}
              className="p-1.5 rounded-lg hover:bg-hover-gray-lm text-std-gray-lm hover:text-black transition-colors ml-0.5"
              title={headerCollapsed ? 'Show details' : 'Hide details'}
            >
              <ChevronDown size={13} className={clsx('transition-transform duration-200', headerCollapsed && 'rotate-180')} />
            </button>
          </div>
        </div>

        {/* Collapsible info strip */}
        {!headerCollapsed && (
          <div className="flex items-center gap-3 px-4 py-1 bg-bg-gray-lm/60 border-t border-nav-gray/30 text-[11px] text-std-gray-lm">
            <span className="truncate min-w-0">{mockSurvey.siteName} · {mockSurvey.siteId} · <span className="hidden md:inline">{mockSurvey.technicianName}</span></span>
            <span className="ml-auto hidden sm:flex items-center gap-2.5 flex-shrink-0">
              <span><span className="font-semibold text-black">{totalMarked}</span>/{totalFields} fields</span>
              <span className="text-nav-gray">·</span>
              <span><span className="font-semibold text-black">{sectionsCompleted}</span>/{totalSections} sections</span>
            </span>
          </div>
        )}
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Section sidebar ── */}
        <aside className={clsx(
          'flex-shrink-0 bg-white border-r border-nav-gray flex flex-col overflow-hidden transition-all duration-200',
          sidebarCollapsed ? 'w-10' : 'w-64'
        )}>
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center py-3 gap-2.5">
              <button onClick={() => setSidebarCollapsed(false)} className="p-1.5 rounded-lg hover:bg-hover-gray-lm text-std-gray-lm hover:text-black transition-colors" title="Expand navigation">
                <ChevronRight size={15} />
              </button>
              <div className="w-full h-px bg-nav-gray/50 my-0.5" />
              {sections.map((section, idx) => {
                const { pct } = getSectionProgress(section)
                const flags = getSectionFlagCount(section)
                const aiCount = getSectionFields(section).filter(f => aiFlags[f.id]).length
                const isActive = idx === activeSectionIdx
                return (
                  <button key={section.id} onClick={() => navigateToSection(idx)} title={section.title}
                    className={clsx('w-5 h-5 rounded-full border-2 transition-colors flex-shrink-0',
                      isActive ? 'border-teal-400 bg-teal-400/20' : pct === 100 ? 'border-green-600 bg-green-600/15' : flags > 0 ? 'border-red-600/50 bg-red-600/10' : aiCount > 0 ? 'border-purple-500/50 bg-purple-500/10' : 'border-nav-gray hover:border-teal-400/60'
                    )}
                  />
                )
              })}
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-nav-gray bg-hover-gray-lm/40 flex-shrink-0">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[10px] font-bold text-std-gray-lm uppercase tracking-widest">Sections</p>
                  <button onClick={() => setSidebarCollapsed(true)} className="p-1 rounded hover:bg-hover-gray-lm text-std-gray-lm hover:text-black transition-colors" title="Collapse navigation">
                    <ChevronLeft size={13} />
                  </button>
                </div>
                <div className="flex items-center gap-2 bg-white border border-nav-gray rounded-lg px-2.5 py-1.5">
                  <Search size={12} className="text-std-gray-lm flex-shrink-0" />
                  <input value={navSearch} onChange={e => setNavSearch(e.target.value)} placeholder="Filter sections…"
                    className="bg-transparent text-xs text-black placeholder-std-gray-lm outline-none w-full" />
                  {navSearch && <button onClick={() => setNavSearch('')} className="text-std-gray-lm hover:text-black transition-colors flex-shrink-0"><X size={11} /></button>}
                </div>
              </div>

              <nav className="flex-1 overflow-y-auto py-2">
                {filteredNavSections.length === 0 && (
                  <p className="text-xs text-std-gray-lm text-center py-5 px-3">No sections match</p>
                )}
                {filteredNavSections.map(({ section, idx }) => {
                  const { marked, total, pct } = getSectionProgress(section)
                  const flags = getSectionFlagCount(section)
                  const sectionAICount = getSectionFields(section).filter(f => aiFlags[f.id]).length
                  const isActive = idx === activeSectionIdx
                  const isDone = sectionComplete.has(section.id) || (total > 0 && marked === total)
                  const itemCount = section.items?.length ?? 0
                  const displayCount = total > 0 ? total : itemCount
                  const hasSubsections = section.subsections.length > 0
                  const childrenCollapsed = isDone && !expandedCompletedSections.has(section.id)

                  return (
                    <div key={section.id}>
                      <div className={clsx('mx-1 rounded-lg transition-all border', isActive ? 'bg-teal-900/8 border-teal-400/35 shadow-sm' : 'border-transparent')}>
                        <div className="flex items-center">
                          <button onClick={() => navigateToSection(idx)} className={clsx('flex-1 text-left px-3 py-2.5 rounded-lg transition-colors min-w-0', !isActive && 'hover:bg-hover-gray-lm')}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={clsx('text-xs font-semibold truncate max-w-[120px]', isActive ? 'text-teal-900' : isDone ? 'text-green-600' : 'text-black')}>
                                {section.title}
                              </span>
                              <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                                {isDone && <span className="w-4 h-4 rounded-full bg-green-600/15 flex items-center justify-center"><Check size={9} className="text-green-600" /></span>}
                                {flags > 0 && <span className="flex items-center gap-0.5 text-[10px] text-red-600 bg-red-600/10 rounded-full px-1.5 py-0.5 border border-red-600/20 font-semibold"><Flag size={8} />{flags}</span>}
                                {sectionAICount > 0 && <span className="flex items-center gap-0.5 text-[10px] text-purple-600 bg-purple-600/10 rounded-full px-1.5 py-0.5 border border-purple-600/20 font-semibold"><Sparkles size={8} />{sectionAICount}</span>}
                                {displayCount > 0 && <span className={clsx('text-[10px] rounded-full px-1.5 py-0.5 font-medium', isActive ? 'bg-teal-400/15 text-teal-600' : 'bg-bg-gray-lm text-std-gray-lm')}>{displayCount}</span>}
                              </div>
                            </div>
                            {total > 0 ? (
                              <div className="space-y-1">
                                <div className="w-full h-1 bg-bg-gray-lm rounded-full overflow-hidden">
                                  <div className={clsx('h-full rounded-full transition-all duration-300', pct === 100 ? 'bg-green-600' : isActive ? 'bg-teal-300' : 'bg-teal-400/60')} style={{ width: `${pct}%` }} />
                                </div>
                                <p className={clsx('text-[10px]', isActive ? 'text-teal-600' : isDone ? 'text-green-600' : 'text-std-gray-lm')}>
                                  {isDone ? 'Complete' : `${marked}/${total} checked`}
                                </p>
                              </div>
                            ) : <p className="text-[10px] text-std-gray-dm">No fields</p>}
                          </button>

                          {isDone && (hasSubsections || (section.items && section.items.length > 0)) && (
                            <button onClick={() => setExpandedCompletedSections(prev => { const n = new Set(prev); n.has(section.id) ? n.delete(section.id) : n.add(section.id); return n })}
                              className="p-1.5 mr-1 rounded text-std-gray-dm hover:text-std-gray-lm hover:bg-hover-gray-lm transition-colors flex-shrink-0">
                              <ChevronDown size={12} className={clsx('transition-transform duration-200', childrenCollapsed && '-rotate-90')} />
                            </button>
                          )}
                        </div>
                      </div>

                      {!childrenCollapsed && (hasSubsections || (section.items && section.items.length > 0)) && (
                        <div className={clsx('ml-4 pl-3 border-l mt-0.5 mb-1 space-y-px', isActive ? 'border-teal-400/40' : 'border-nav-gray')}>
                          {section.subsections.map((sub, subIdx) => {
                            const { marked: ssMarked, total: ssTotal, pct: ssPct } = getSubsectionProgress(sub.fields)
                            const subDone = ssTotal > 0 && ssMarked === ssTotal
                            const subFlags = sub.fields.filter(f => f.flagged).length
                            const subAICount = sub.fields.filter(f => aiFlags[f.id]).length
                            const isActiveSub = isActive && activeSubsectionIdx === subIdx
                            return (
                              <div key={sub.id} onClick={() => navigateToSection(idx, subIdx)} className={clsx('px-2 py-1.5 rounded-md cursor-pointer transition-colors', isActiveSub ? 'bg-teal-400/12 border border-teal-400/30' : isActive ? 'hover:bg-teal-400/8' : 'hover:bg-hover-gray-lm')}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className={clsx('text-[11px] truncate max-w-[110px]', subDone ? 'text-green-600 font-medium' : isActiveSub ? 'text-teal-600 font-semibold' : isActive ? 'text-teal-900 font-medium' : 'text-std-gray-lm')}>{sub.title}</span>
                                  <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                                    {subDone && <Check size={9} className="text-green-600" />}
                                    {subFlags > 0 && <span className="flex items-center gap-0.5 text-[9px] text-red-600 font-semibold"><Flag size={7} />{subFlags}</span>}
                                    {subAICount > 0 && <Sparkles size={9} className="text-purple-500" />}
                                    {ssTotal > 0 && <span className={clsx('text-[9px] font-medium', isActiveSub ? 'text-teal-600' : isActive ? 'text-teal-600' : 'text-std-gray-dm')}>{ssMarked}/{ssTotal}</span>}
                                  </div>
                                </div>
                                {ssTotal > 0 && <div className="w-full h-0.5 bg-bg-gray-lm rounded-full overflow-hidden"><div className={clsx('h-full rounded-full transition-all duration-300', ssPct === 100 ? 'bg-green-600' : isActive ? 'bg-teal-300' : 'bg-teal-400/40')} style={{ width: `${ssPct}%` }} /></div>}
                              </div>
                            )
                          })}
                          {section.items && section.items.map(item => {
                            const itemFields = item.subsections.flatMap(s => s.fields)
                            const iMarked = itemFields.filter(f => f.marked).length
                            const iTotal = itemFields.length
                            const iPct = iTotal > 0 ? Math.round((iMarked / iTotal) * 100) : 0
                            const iDone = iTotal > 0 && iMarked === iTotal
                            const iFlags = itemFields.filter(f => f.flagged).length
                            return (
                              <div key={item.id} onClick={() => { navigateToSection(idx); if (section.drillIn) setActiveItemId(item.id) }} className={clsx('px-2 py-1.5 rounded-md cursor-pointer', isActive ? 'hover:bg-teal-400/8' : 'hover:bg-hover-gray-lm')}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className={clsx('text-[11px] truncate max-w-[110px]', iDone ? 'text-green-600 font-medium' : isActive ? 'text-teal-900 font-medium' : 'text-std-gray-lm')}>{item.label}</span>
                                  <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                                    {iDone && <Check size={9} className="text-green-600" />}
                                    {iFlags > 0 && <span className="flex items-center gap-0.5 text-[9px] text-red-600 font-semibold"><Flag size={7} />{iFlags}</span>}
                                    {iTotal > 0 && <span className={clsx('text-[9px] font-medium', isActive ? 'text-teal-600' : 'text-std-gray-dm')}>{iMarked}/{iTotal}</span>}
                                  </div>
                                </div>
                                {iTotal > 0 && <div className="w-full h-0.5 bg-bg-gray-lm rounded-full overflow-hidden"><div className={clsx('h-full rounded-full transition-all duration-300', iPct === 100 ? 'bg-green-600' : isActive ? 'bg-teal-300' : 'bg-teal-400/40')} style={{ width: `${iPct}%` }} /></div>}
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
          )}
        </aside>

        {/* ── Active section view ── */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex flex-1 min-h-0">
            {/* Scrollable content */}
            <div className="flex-1 flex flex-col min-h-0">

              {/* Sticky section header */}
              <div className="sticky top-0 z-10 bg-bg-gray-lm/95 backdrop-blur-sm border-b border-nav-gray/40 px-6 py-3 flex items-center justify-between flex-shrink-0">
                <div>
                  {hasSubsectionNav ? (
                    <>
                      <p className="text-xs font-medium text-std-gray-lm flex items-center gap-1.5">
                        {activeSection.title}
                        <ChevronRight size={12} />
                        <span className="text-[10px] font-medium text-std-gray-dm">{activeSubsectionIdx + 1} of {navPageCount}</span>
                      </p>
                      <h2 className="text-base font-bold text-teal-900 mt-0.5">{activeSub!.title}</h2>
                      <p className="text-xs text-std-gray-lm mt-0.5">
                        {subMarked} of {subTotal} fields checked
                        {subFlags > 0 && <span className="ml-2 text-red-600 font-semibold">· {subFlags} flagged</span>}
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-base font-bold text-teal-900">{activeSection.title}</h2>
                      <p className="text-xs text-std-gray-lm mt-0.5">
                        {sMarked} of {sTotal} fields checked
                        {sFlags > 0 && <span className="ml-2 text-red-600 font-semibold">· {sFlags} flagged</span>}
                      </p>
                    </>
                  )}
                </div>
                {subTotal > 0 && (
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <div className="w-36 h-2 bg-nav-gray rounded-full overflow-hidden">
                      <div className={clsx('h-full rounded-full transition-all duration-500', subPct === 100 ? 'bg-green-600' : 'bg-teal-300')} style={{ width: `${subPct}%` }} />
                    </div>
                    <span className={clsx('text-sm font-bold w-10 text-right', subPct === 100 ? 'text-green-600' : 'text-teal-400')}>{subPct}%</span>
                  </div>
                )}
              </div>

              {/* Field content */}
              <div className="flex-1 overflow-y-auto bg-bg-gray-lm/50">
                <div className="px-6 py-5 space-y-4">
                  {/* Site Information — shown on first section */}
                  {activeSectionIdx === 0 && !activeItemId && (
                    <div className="rounded-xl border border-nav-gray bg-white overflow-hidden">
                      <div className="px-5 py-3 border-b border-nav-gray/40 bg-bg-gray-lm/40">
                        <p className="text-[10px] font-bold text-std-gray-lm uppercase tracking-widest">Site Information</p>
                      </div>
                      <div className="px-5 py-4 grid grid-cols-2 gap-x-8 gap-y-4">
                        {([
                          ['Site Name',   mockSurvey.siteName],
                          ['Site ID',     mockSurvey.siteId],
                          ['Survey Type', mockSurvey.surveyType],
                          ['Customer',    mockSurvey.customer],
                          ['Technician',  mockSurvey.technicianName],
                          ['Coordinates', mockSurvey.coordinates],
                        ] as [string, string][]).map(([label, value]) => (
                          <div key={label}>
                            <p className="text-[10px] font-bold text-std-gray-lm uppercase tracking-wide">{label}</p>
                            <p className="text-sm text-black mt-0.5">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {sTotal === 0 && (!activeSection.items || activeSection.items.length === 0) ? (
                    <div className="card border-dashed border-nav-gray py-16 text-center">
                      <p className="text-std-gray-lm text-sm font-medium">No items in this section</p>
                      {activeSection.items !== undefined && (
                        <button className="mt-3 btn-primary text-xs px-3 py-1.5 mx-auto"><Plus size={13} /> Add {singularize(activeSection.title)}</button>
                      )}
                    </div>

                  ) : activeSection.drillIn && activeItemId ? (
                    (() => {
                      const item = activeSection.items?.find(i => i.id === activeItemId)
                      if (!item) return null
                      const allItemFields = item.subsections.flatMap(s => s.fields)
                      const dMarked = allItemFields.filter(f => f.marked).length
                      const dTotal = allItemFields.length
                      const dPct = dTotal > 0 ? Math.round((dMarked / dTotal) * 100) : 0
                      return (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-sm text-std-gray-lm">
                            <button onClick={() => setActiveItemId(null)} className="hover:text-black transition-colors flex items-center gap-1"><ChevronLeft size={14} /> {activeSection.title}</button>
                            <ChevronRight size={13} />
                            <span className="text-black font-medium">{item.label}</span>
                            {dTotal > 0 && <span className="ml-auto text-xs">{dMarked}/{dTotal} checked · {dPct}%</span>}
                          </div>
                          <div className="card">
                            {item.subsections.map((sub, si) => (
                              <div key={sub.id}>
                                {si > 0 && <div className="h-px bg-nav-gray/60" />}
                                <SubsectionBlock title={sub.title} fields={sub.fields} onUpdateField={updateField} showTitle={item.subsections.length > 1} />
                              </div>
                            ))}
                          </div>
                          {item.subItems && (
                            <FeedlineTable
                              carrierName={item.label}
                              initialItems={item.subItems.items}
                              onUpdateField={updateField}
                            />
                          )}
                        </div>
                      )
                    })()

                  ) : activeSection.drillIn && !activeItemId ? (
                    <div className="card overflow-hidden">
                      <div className="divide-y divide-nav-gray/60">
                        {activeSection.items?.map(item => {
                          const itemFields = item.subsections.flatMap(s => s.fields)
                          const iMarked = itemFields.filter(f => f.marked).length
                          const iTotal = itemFields.length
                          const iPct = iTotal > 0 ? Math.round((iMarked / iTotal) * 100) : 0
                          const iFlags = itemFields.filter(f => f.flagged).length
                          const iPhotos = itemFields.filter(f => f.type === 'photo' && f.value).length
                          const isDone = iTotal > 0 && iMarked === iTotal
                          return (
                            <div key={item.id} onClick={() => setActiveItemId(item.id)} className="flex items-center justify-between px-6 py-4 hover:bg-hover-gray-lm cursor-pointer group transition-colors">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-teal-400/8 border border-teal-400/20 flex items-center justify-center flex-shrink-0">
                                  <MoreHorizontal size={16} className="text-teal-400" />
                                </div>
                                <div className="min-w-0">
                                  <p className={clsx('text-sm font-semibold', isDone ? 'text-green-600' : 'text-black')}>{item.label}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {iFlags > 0 && <span className="flex items-center gap-0.5 text-[10px] text-red-600 font-semibold"><Flag size={8} />{iFlags} flag{iFlags > 1 ? 's' : ''}</span>}
                                    {iPhotos > 0 && <PhotoCountBadge count={iPhotos} />}
                                    {item.subItems && <span className="text-[10px] text-std-gray-lm">{item.subItems.items.length} {item.subItems.groupLabel.toLowerCase()}</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                                {iTotal > 0 && (
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 h-1.5 bg-bg-gray-lm rounded-full overflow-hidden">
                                      <div className={clsx('h-full rounded-full transition-all', isDone ? 'bg-green-600' : 'bg-teal-300')} style={{ width: `${iPct}%` }} />
                                    </div>
                                    <span className="text-xs text-std-gray-lm w-14 text-right">{iMarked}/{iTotal}</span>
                                  </div>
                                )}
                                <ChevronRight size={15} className="text-nav-gray group-hover:text-teal-400 transition-colors" />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <div className="border-t border-nav-gray/60 px-6 py-3">
                        <button className="w-full flex items-center justify-center gap-2 py-2 text-sm text-teal-400 hover:text-teal-600 hover:bg-teal-400/8 rounded-lg transition-colors font-medium">
                          <Plus size={15} /> Add {singularize(activeSection.title)}
                        </button>
                      </div>
                    </div>

                  ) : (
                    <div className="card">
                      {hasSubsectionNav ? (
                        <SubsectionBlock title={activeSub!.title} fields={activeSub!.fields} onUpdateField={updateField} showTitle={false} />
                      ) : (
                        activeSection.subsections.map((sub, subIdx) => (
                          <div key={sub.id}>
                            {subIdx > 0 && <div className="h-px bg-nav-gray/60 mx-0" />}
                            <SubsectionBlock title={sub.title} fields={sub.fields} onUpdateField={updateField} showTitle={false} />
                          </div>
                        ))
                      )}

                      {activeSection.items && activeSection.items.length > 0 && (
                        <div className="divide-y divide-nav-gray/60">
                          {activeSection.items.map((item) => {
                            const itemFields = item.subsections.flatMap(s => s.fields)
                            const itemMarked = itemFields.filter(f => f.marked).length
                            const itemTotal = itemFields.length
                            const itemPct = itemTotal > 0 ? Math.round((itemMarked / itemTotal) * 100) : 0
                            const itemFlags = itemFields.filter(f => f.flagged).length
                            const itemPhotos = itemFields.filter(f => f.type === 'photo' && f.value).length
                            const isCollapsed = collapsedItems.has(item.id)
                            const isDone = itemTotal > 0 && itemMarked === itemTotal
                            return (
                              <div key={item.id}>
                                <div className={clsx('flex items-center justify-between px-6 py-3 cursor-pointer transition-colors', isCollapsed ? 'hover:bg-hover-gray-lm' : 'bg-hover-gray-lm/50')} onClick={() => toggleItem(item.id)}>
                                  <div className="flex items-center gap-3 min-w-0">
                                    <ChevronRight size={14} className={clsx('text-std-gray-lm transition-transform duration-200 flex-shrink-0', !isCollapsed && 'rotate-90')} />
                                    <span className={clsx('text-sm font-semibold truncate', isDone ? 'text-green-600' : 'text-black')}>{item.label}</span>
                                    {itemFlags > 0 && <span className="flex items-center gap-0.5 text-[10px] text-red-600 bg-red-600/10 border border-red-600/20 rounded-full px-1.5 py-0.5 font-semibold flex-shrink-0"><Flag size={9} />{itemFlags}</span>}
                                    {itemPhotos > 0 && <PhotoCountBadge count={itemPhotos} />}
                                  </div>
                                  <div className="flex items-center gap-3 flex-shrink-0 ml-4" onClick={e => e.stopPropagation()}>
                                    {itemTotal > 0 && (
                                      <div className="flex items-center gap-2">
                                        <div className="w-20 h-1.5 bg-bg-gray-lm rounded-full overflow-hidden">
                                          <div className={clsx('h-full rounded-full transition-all duration-300', isDone ? 'bg-green-600' : 'bg-teal-300')} style={{ width: `${itemPct}%` }} />
                                        </div>
                                        <span className="text-xs text-std-gray-lm w-16 text-right">{itemMarked}/{itemTotal} checked</span>
                                      </div>
                                    )}
                                    <button className="p-1.5 rounded-full hover:bg-red-600/10 text-std-gray-lm hover:text-red-600 transition-colors border border-nav-gray flex-shrink-0"><Minus size={13} /></button>
                                  </div>
                                </div>
                                {!isCollapsed && (
                                  <div className="border-t border-nav-gray/40">
                                    {item.subsections.map((sub, si) => (
                                      <div key={sub.id}>
                                        {si > 0 && <div className="h-px bg-nav-gray/50 mx-6" />}
                                        <SubsectionBlock title={sub.title} fields={sub.fields} onUpdateField={updateField} showTitle={item.subsections.length > 1} nested />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {activeSection.items !== undefined && (
                        <div className="border-t border-nav-gray/60 px-6 py-3">
                          <button className="w-full flex items-center justify-center gap-2 py-2 text-sm text-teal-400 hover:text-teal-600 hover:bg-teal-400/8 rounded-lg transition-colors font-medium">
                            <Plus size={15} /> Add {singularize(activeSection.title)}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Footer nav ── */}
              <div className="bg-white border-t border-nav-gray px-3 md:px-6 py-3 flex items-center justify-between flex-shrink-0 gap-2">
                <button onClick={goPrev} disabled={isFirstNav} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-nav-gray text-sm font-medium text-std-gray-lm hover:bg-hover-gray-lm hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0">
                  <ChevronLeft size={15} />
                  <span className="max-w-[100px] truncate hidden md:inline">{getPrevLabel()}</span>
                </button>
                <div className="flex items-center gap-2 min-w-0">
                  {subFlags > 0 && (
                    <span className="hidden md:flex items-center gap-1.5 text-xs text-red-600 bg-red-600/8 border border-red-600/20 rounded-full px-3 py-1.5 font-medium flex-shrink-0">
                      <Flag size={12} /> {subFlags} flag{subFlags > 1 ? 's' : ''} to review
                    </span>
                  )}
                  <button
                    onClick={() => markSectionComplete(activeSection.id)}
                    disabled={allSubFieldsChecked}
                    className={clsx(
                      'flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0',
                      allSubFieldsChecked ? 'bg-green-600/10 border border-green-600/25 text-green-600 cursor-default' : 'bg-teal-400/10 border border-teal-400/30 text-teal-600 hover:bg-teal-400/20'
                    )}
                  >
                    <CheckCheck size={15} />
                    <span className="hidden sm:inline">{allSubFieldsChecked ? (hasSubsectionNav ? 'Subsection Complete' : 'Section Complete') : 'Mark All Checked'}</span>
                  </button>
                </div>
                <button onClick={goNext} disabled={isLastNav} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-nav-gray text-sm font-medium text-std-gray-lm hover:bg-hover-gray-lm hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0">
                  <span className="max-w-[100px] truncate hidden md:inline">{getNextLabel()}</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

    {/* ── Flags modal ── */}
    {rightTab === 'flags' && createPortal(
      <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setRightTab(null)}>
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
        <div className="relative w-full max-w-sm bg-white shadow-2xl flex flex-col h-full" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-nav-gray flex-shrink-0">
            <Flag size={14} className="text-red-600" />
            <span className="text-sm font-semibold text-black">Flags</span>
            {totalFlags > 0 && (
              <span className="rounded-full text-[10px] font-bold px-1.5 py-0.5 bg-red-600/15 text-red-600">{totalFlags}</span>
            )}
            <button onClick={() => setRightTab(null)} className="ml-auto p-1.5 rounded-lg hover:bg-hover-gray-lm text-std-gray-lm hover:text-black transition-colors">
              <X size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {flaggedBySection.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2 text-std-gray-lm p-4">
                <CheckCheck size={20} className="text-green-600" />
                <p className="text-sm font-medium text-black">No flags</p>
                <p className="text-xs text-center">All fields are clear.</p>
              </div>
            ) : (
              <div className="p-3 space-y-1.5">
                {flaggedBySection.map(({ field, sectionIdx, subsectionIdx, locationLabel }) => {
                  const isHere = sectionIdx === activeSectionIdx && subsectionIdx === activeSubsectionIdx
                  return (
                    <button
                      key={field.id}
                      onClick={() => { navigateToSection(sectionIdx, subsectionIdx); setRightTab(null) }}
                      className={clsx(
                        'w-full text-left p-3 rounded-lg border transition-colors group',
                        isHere ? 'border-red-600/40 bg-red-600/[0.07]' : 'border-red-600/20 bg-red-600/[0.03] hover:bg-red-600/[0.07] hover:border-red-600/40'
                      )}
                    >
                      <p className="text-xs font-semibold text-black group-hover:text-red-600 transition-colors truncate">{field.label}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Flag size={10} className="text-red-600 flex-shrink-0" />
                        <span className="text-[11px] text-std-gray-lm truncate">{locationLabel}</span>
                        {isHere
                          ? <span className="text-[10px] text-red-600 font-semibold ml-auto flex-shrink-0">Here</span>
                          : <ChevronRight size={11} className="text-nav-gray group-hover:text-red-600 ml-auto flex-shrink-0" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body
    )}

    {/* ── AI Analysis modal ── */}
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
                      const field = allFields.find(f => f.id === fieldId)
                      if (!field) return null
                      const loc = findFieldLocation(fieldId)
                      const isHere = loc && loc.sectionIdx === activeSectionIdx && loc.subsectionIdx === activeSubsectionIdx
                      const borderCls = entry.severity === 'error' ? 'border-red-600/25 bg-red-600/[0.04]' : entry.severity === 'warning' ? 'border-amber-500/25 bg-amber-500/[0.04]' : 'border-purple-600/20 bg-purple-600/[0.03]'
                      const iconEl = entry.severity === 'error'
                        ? <AlertTriangle size={11} className="text-red-600 flex-shrink-0 mt-0.5" />
                        : entry.severity === 'warning'
                          ? <AlertTriangle size={11} className="text-amber-600 flex-shrink-0 mt-0.5" />
                          : <Sparkles size={11} className="text-purple-600 flex-shrink-0 mt-0.5" />
                      return (
                        <button
                          key={fieldId}
                          onClick={() => { if (loc) { navigateToSection(loc.sectionIdx, loc.subsectionIdx); setRightTab(null) } }}
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
            <p className="text-sm text-std-gray-lm mt-1">
              {totalFlags > 0 ? `${totalFlags} field${totalFlags > 1 ? 's' : ''} are flagged and need attention before completing.` : 'This will lock the survey and generate a report-ready export.'}
            </p>
          </div>
          <div className="px-6 py-4 space-y-3 border-b border-nav-gray">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-black">Fields</span>
                <span className="text-xs text-std-gray-lm">{overallPct}% complete</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-bg-gray-lm rounded-full overflow-hidden">
                  <div className={clsx('h-full rounded-full transition-all', overallPct === 100 ? 'bg-green-600' : 'bg-teal-300')} style={{ width: `${overallPct}%` }} />
                </div>
                <span className="text-xs font-semibold text-black w-20 text-right flex-shrink-0">{totalMarked}/{totalFields} checked</span>
              </div>
              {totalFields - totalMarked > 0 && <p className="text-[11px] text-amber-600 mt-1 font-medium">{totalFields - totalMarked} field{totalFields - totalMarked > 1 ? 's' : ''} not yet checked</p>}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-black">Sections</span>
                <span className="text-xs text-std-gray-lm">{sectionsCompleted}/{totalSections} complete</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600/8 border border-green-600/20">
                  <Check size={12} className="text-green-600 flex-shrink-0" />
                  <div><p className="text-sm font-bold text-green-600">{sectionsCompleted}</p><p className="text-[10px] text-green-700">Completed</p></div>
                </div>
                <div className={clsx('flex items-center gap-2 px-3 py-2 rounded-lg border', totalSections - sectionsCompleted > 0 ? 'bg-amber-500/8 border-amber-500/20' : 'bg-bg-gray-lm border-nav-gray')}>
                  <AlertTriangle size={12} className={totalSections - sectionsCompleted > 0 ? 'text-amber-600 flex-shrink-0' : 'text-std-gray-dm flex-shrink-0'} />
                  <div><p className={clsx('text-sm font-bold', totalSections - sectionsCompleted > 0 ? 'text-amber-600' : 'text-std-gray-lm')}>{totalSections - sectionsCompleted}</p><p className={clsx('text-[10px]', totalSections - sectionsCompleted > 0 ? 'text-amber-700' : 'text-std-gray-dm')}>Incomplete</p></div>
                </div>
              </div>
            </div>
            {totalFlags > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600/8 border border-red-600/20">
                <Flag size={12} className="text-red-600 flex-shrink-0" />
                <p className="text-xs font-semibold text-red-600">{totalFlags} flagged field{totalFlags > 1 ? 's' : ''} need attention</p>
              </div>
            )}
          </div>
          {totalFlags > 0 && (
            <div className="px-6 py-3 max-h-40 overflow-y-auto space-y-1.5">
              {flaggedBySection.map(({ field, locationLabel }) => (
                <div key={field.id} className="flex items-center gap-2 text-xs">
                  <Flag size={10} className="text-red-600 flex-shrink-0" />
                  <span className="font-medium text-black truncate">{field.label}</span>
                  <span className="text-std-gray-lm flex-shrink-0 truncate">· {locationLabel}</span>
                </div>
              ))}
            </div>
          )}
          <div className="px-6 py-4 flex items-center justify-end gap-3">
            <button onClick={() => setCompletionModalOpen(false)} className="btn-secondary text-sm">Cancel</button>
            {totalFlags > 0 && (
              <button onClick={() => { setCompletionModalOpen(false); setRightTab('flags') }} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-red-600/30 bg-red-600/8 text-red-600 hover:bg-red-600/15 transition-colors">
                <Flag size={13} /> Review Flags
              </button>
            )}
            <button onClick={() => { setSurveyComplete(true); setCompletionModalOpen(false) }} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors">
              <CheckCircle2 size={14} />
              {totalFlags > 0 ? 'Complete Anyway' : 'Mark Complete'}
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}

    {surveyComplete && (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-green-600 text-white px-5 py-3 rounded-2xl shadow-xl">
        <CheckCircle2 size={18} />
        <div>
          <p className="text-sm font-semibold">Survey marked complete</p>
          <p className="text-xs text-green-100">{mockSurvey.name} · {totalMarked} fields reviewed</p>
        </div>
        <button onClick={() => navigate(-1)} className="ml-4 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-semibold transition-colors">Back to Visit</button>
        <button onClick={() => setSurveyComplete(false)} className="p-1 rounded hover:bg-white/20 transition-colors"><X size={14} /></button>
      </div>
    )}
    </div>
    </AIFlagsContext.Provider>
  )
}

// ─── Subsection block ──────────────────────────────────────────────────────────
function SubsectionBlock({
  title, fields, onUpdateField, showTitle, nested
}: {
  title: string
  fields: SurveyField[]
  onUpdateField: (id: string, patch: Partial<SurveyField>) => void
  showTitle?: boolean
  nested?: boolean
}) {
  return (
    <div>
      {showTitle && (
        <div className="flex items-center gap-3 px-6 py-2.5 bg-hover-gray-lm/60 border-b border-nav-gray/40">
          <ChevronRight size={13} className="text-std-gray-lm flex-shrink-0" />
          <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">{title}</span>
        </div>
      )}
      <div className="divide-y divide-nav-gray/30">
        {fields.map(field => (
          <FieldRow key={field.id} field={field} onUpdate={onUpdateField} nested={nested} />
        ))}
      </div>
    </div>
  )
}

// ─── Field row ─────────────────────────────────────────────────────────────────
function FieldRow({
  field, onUpdate, nested
}: {
  field: SurveyField
  onUpdate: (id: string, patch: Partial<SurveyField>) => void
  nested?: boolean
}) {
  const aiFlags = useContext(AIFlagsContext)
  const aiFlag = aiFlags[field.id]
  const [selectOpen, setSelectOpen] = useState(false)
  const [selectValue, setSelectValue] = useState(field.value ?? '')
  const [localText, setLocalText] = useState(field.value ?? '')
  const triggerRef = useRef<HTMLDivElement>(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 })

  useEffect(() => {
    if (!selectOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        const panel = document.getElementById(`select-panel-${field.id}`)
        if (!panel?.contains(e.target as Node)) setSelectOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectOpen, field.id])

  const px = nested ? 'px-4' : 'px-6'
  const isPhoto = field.type === 'photo'
  const rowBg = field.flagged ? 'bg-red-600/5' : field.marked ? 'bg-green-600/[0.04]' : 'bg-white'
  const boxBase = clsx('rounded-lg border transition-all duration-200', field.marked ? 'border-green-600/20 bg-green-600/[0.03]' : 'border-nav-gray bg-white')
  const focusRing = 'focus-within:border-teal-300 focus-within:ring-2 focus-within:ring-teal-300/20'

  const actionButtons = (
    <div className="flex items-center gap-1 flex-shrink-0">
      <button
        onClick={() => onUpdate(field.id, { flagged: !field.flagged, ...((!field.flagged) ? { marked: false } : {}) })}
        className={clsx('p-1.5 rounded-lg transition-colors', field.flagged ? 'bg-red-600/10 text-red-600 border border-red-600/25' : 'text-std-gray-lm hover:text-red-600 hover:bg-red-600/8')}
        title={field.flagged ? 'Remove flag' : 'Flag for review'}
      >
        <Flag size={13} />
      </button>
      <button
        disabled={field.flagged}
        onClick={() => !field.flagged && onUpdate(field.id, { marked: !field.marked })}
        className={clsx('p-1.5 rounded-lg transition-all duration-200',
          field.flagged ? 'opacity-30 cursor-not-allowed text-std-gray-lm border border-nav-gray' :
          field.marked ? 'bg-green-600/12 text-green-600 border border-green-600/30' :
          'text-std-gray-lm border border-nav-gray hover:text-green-600 hover:border-green-600/40 hover:bg-green-600/8'
        )}
        title={field.flagged ? 'Clear the flag before marking as reviewed' : field.marked ? 'Uncheck' : 'Mark as reviewed'}
      >
        <CheckCheck size={13} />
      </button>
    </div>
  )

  // AI severity styles
  const aiSeverityStyle = aiFlag
    ? aiFlag.severity === 'error'
      ? { badge: 'text-red-600 bg-red-600/10 border-red-600/20', insight: 'bg-red-600/5 border-red-600/20', icon: 'text-red-600', label: 'AI Issue' }
      : aiFlag.severity === 'warning'
        ? { badge: 'text-amber-600 bg-amber-500/10 border-amber-500/20', insight: 'bg-amber-500/5 border-amber-500/20', icon: 'text-amber-600', label: 'AI Warning' }
        : { badge: 'text-purple-600 bg-purple-600/10 border-purple-600/20', insight: 'bg-purple-600/5 border-purple-600/20', icon: 'text-purple-600', label: 'AI Suggestion' }
    : null

  return (
    <div className={clsx('transition-colors duration-200', rowBg)}>
      <div className={clsx('flex items-stretch gap-3', px)}>
        <div className={clsx('w-[3px] flex-shrink-0 rounded-full my-3 transition-colors duration-300', field.marked ? 'bg-green-600' : 'bg-red-600')} />
        <div className="flex-1 min-w-0 py-4">
          {/* Label + chips */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={clsx('text-sm font-semibold leading-snug transition-colors', field.marked ? 'text-std-gray-lm' : 'text-black')}>
              {field.label}
            </span>
            {field.required && !field.value && (
              <span className="inline-flex items-center text-[10px] font-semibold text-red-600 bg-red-600/10 border border-red-600/20 rounded-full px-2 py-0.5">Required</span>
            )}
            {field.flagged && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-600/10 border border-red-600/20 rounded-full px-2 py-0.5"><Flag size={9} /> Flagged</span>
            )}
            {field.marked && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-600 bg-green-600/10 border border-green-600/20 rounded-full px-2 py-0.5"><Check size={9} /> Reviewed</span>
            )}
            {/* AI badge */}
            {aiFlag && aiSeverityStyle && (
              <span className={clsx('inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5 border', aiSeverityStyle.badge)}>
                <Sparkles size={9} /> {aiSeverityStyle.label}
              </span>
            )}
          </div>

          {/* Value box */}
          {isPhoto ? (
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0"><FieldValue field={field} onUpdate={onUpdate} /></div>
              {actionButtons}
            </div>
          ) : field.type === 'yesno' ? (
            <div className={clsx(boxBase)}>
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="flex-1 min-w-0"><FieldValue field={field} onUpdate={onUpdate} /></div>
                <div onClick={e => e.stopPropagation()}>{actionButtons}</div>
              </div>
            </div>
          ) : field.type === 'select' ? (
            <>
              <div
                ref={triggerRef}
                onClick={() => { if (field.marked) return; const rect = triggerRef.current?.getBoundingClientRect(); if (rect) setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width }); setSelectOpen(v => !v) }}
                className={clsx(boxBase, !field.marked && 'cursor-pointer hover:border-teal-300', selectOpen && 'border-indigo-500/40 ring-2 ring-indigo-500/10')}
              >
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className={clsx('flex-1 min-w-0 text-sm', field.value ? 'text-black' : 'text-std-gray-dm italic', field.marked && 'opacity-60')}>
                    {field.value ?? '— Select —'}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => !field.marked && (() => { const rect = triggerRef.current?.getBoundingClientRect(); if (rect) setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width }); setSelectOpen(v => !v) })()}
                      disabled={field.marked}
                      className="p-1.5 rounded-lg text-std-gray-lm hover:text-black hover:bg-hover-gray-lm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronDown size={13} className={clsx('transition-transform duration-150', selectOpen && 'rotate-180')} />
                    </button>
                    {actionButtons}
                  </div>
                </div>
              </div>
              {selectOpen && createPortal(
                <div id={`select-panel-${field.id}`} style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 999 }} className="bg-white border border-nav-gray rounded-xl shadow-lg p-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {['Good', 'Fair', 'Poor', 'Gravel', 'Paved', 'Dirt', 'Grass', 'Grid', 'Generator'].map(o => (
                      <button key={o} onMouseDown={() => { setSelectValue(o); onUpdate(field.id, { value: o }); setSelectOpen(false) }}
                        className={clsx('px-3 py-1 rounded-full text-xs font-semibold border transition-all', selectValue === o || field.value === o ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-indigo-500/8 text-indigo-500 border-indigo-500/25 hover:bg-indigo-500 hover:text-white')}>
                        {o}
                      </button>
                    ))}
                  </div>
                </div>,
                document.body
              )}
            </>
          ) : field.type === 'textarea' ? (
            <div className={clsx(boxBase, !field.marked && focusRing)}>
              <textarea value={localText} onChange={e => setLocalText(e.target.value)} onBlur={e => onUpdate(field.id, { value: e.target.value || null })}
                rows={3} disabled={field.marked} placeholder="Enter value…"
                className={clsx('w-full px-3 py-2.5 text-sm bg-transparent focus:outline-none resize-none', field.marked && 'opacity-60 cursor-not-allowed')} />
              <div className="flex justify-end items-center px-3 py-1.5 border-t border-nav-gray/40">{actionButtons}</div>
            </div>
          ) : field.type === 'number' ? (
            <div className={clsx(boxBase, !field.marked && focusRing)}>
              <div className="flex items-center gap-1 px-2 py-1.5">
                <button
                  onClick={() => { const n = (Number(localText) || 0) - 1; const s = String(n); setLocalText(s); onUpdate(field.id, { value: s }) }}
                  disabled={field.marked}
                  className="p-1.5 rounded-lg hover:bg-hover-gray-lm text-std-gray-lm hover:text-black transition-colors flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number" value={localText}
                  onChange={e => setLocalText(e.target.value)}
                  onBlur={e => onUpdate(field.id, { value: e.target.value || null })}
                  onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                  disabled={field.marked} placeholder="0"
                  className={clsx('flex-1 min-w-0 text-sm bg-transparent focus:outline-none text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none', field.marked && 'opacity-60 cursor-not-allowed')}
                />
                <button
                  onClick={() => { const n = (Number(localText) || 0) + 1; const s = String(n); setLocalText(s); onUpdate(field.id, { value: s }) }}
                  disabled={field.marked}
                  className="p-1.5 rounded-lg hover:bg-hover-gray-lm text-std-gray-lm hover:text-black transition-colors flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Plus size={14} />
                </button>
                <div className="w-px h-4 bg-nav-gray mx-1 flex-shrink-0" />
                <div onClick={e => e.stopPropagation()}>{actionButtons}</div>
              </div>
            </div>
          ) : (
            <div className={clsx(boxBase, !field.marked && focusRing)}>
              <div className="flex items-center gap-3 px-3 py-2">
                <input type="text" value={localText}
                  onChange={e => setLocalText(e.target.value)} onBlur={e => onUpdate(field.id, { value: e.target.value || null })}
                  onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                  disabled={field.marked} placeholder="Enter value…"
                  className={clsx('flex-1 min-w-0 text-sm bg-transparent focus:outline-none', field.marked && 'opacity-60 cursor-not-allowed')} />
                <div onClick={e => e.stopPropagation()}>{actionButtons}</div>
              </div>
            </div>
          )}

          {/* Inline AI insight — shown below the field value */}
          {aiFlag && aiSeverityStyle && (
            <div className={clsx('mt-2 p-2.5 rounded-lg border flex items-start gap-2', aiSeverityStyle.insight)}>
              <Sparkles size={11} className={clsx('flex-shrink-0 mt-0.5', aiSeverityStyle.icon)} />
              <div>
                <p className={clsx('text-[11px] font-semibold', aiSeverityStyle.icon)}>{aiSeverityStyle.label}</p>
                <p className="text-xs text-std-gray-lm mt-0.5 leading-relaxed">{aiFlag.issue}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Field value display ───────────────────────────────────────────────────────
function FieldValue({ field, onUpdate }: { field: SurveyField; onUpdate: (id: string, p: Partial<SurveyField>) => void }) {
  switch (field.type) {
    case 'yesno':    return <YesNoField field={field} onUpdate={onUpdate} />
    case 'photo':    return <PhotoField field={field} />
    case 'textarea': return <p className="text-sm text-black leading-relaxed whitespace-pre-wrap">{field.value ?? <span className="text-std-gray-dm italic">No value</span>}</p>
    default: return <p className={clsx('text-sm', field.value ? 'text-black' : 'text-std-gray-dm italic')}>{field.value ?? 'No value'}</p>
  }
}

function YesNoField({ field, onUpdate }: { field: SurveyField; onUpdate: (id: string, p: Partial<SurveyField>) => void }) {
  const val = field.value
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => onUpdate(field.id, { value: val === 'Yes' ? null : 'Yes' })}
        className={clsx('px-5 py-1.5 rounded-full text-sm font-semibold border-2 transition-all',
          val === 'Yes' ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm' : 'bg-white text-std-gray-lm border-nav-gray hover:border-indigo-400/50 hover:text-indigo-600'
        )}
      >Yes</button>
      <button
        onClick={() => onUpdate(field.id, { value: val === 'No' ? null : 'No' })}
        className={clsx('px-5 py-1.5 rounded-full text-sm font-semibold border-2 transition-all',
          val === 'No' ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm' : 'bg-white text-std-gray-lm border-nav-gray hover:border-indigo-400/50 hover:text-indigo-600'
        )}
      >No</button>
      {val && <button onClick={() => onUpdate(field.id, { value: null })} className="p-1 rounded-full hover:bg-hover-gray-lm text-std-gray-dm hover:text-std-gray-lm transition-colors"><X size={13} /></button>}
    </div>
  )
}

type FeedlineRow = { id: string; size: string; count: string; isNew?: boolean }

function FeedlineTable({
  carrierName,
  initialItems,
  onUpdateField,
}: {
  carrierName: string
  initialItems: Array<{ id: string; fields: SurveyField[] }>
  onUpdateField: (id: string, p: Partial<SurveyField>) => void
}) {
  const [rows, setRows] = useState<FeedlineRow[]>(() =>
    initialItems.map(sub => ({
      id: sub.id,
      size: sub.fields.find(f => f.label === 'Size')?.value ?? '',
      count: sub.fields.find(f => f.label === 'Count')?.value ?? '',
    }))
  )

  const updateRow = (id: string, col: 'size' | 'count', value: string) => {
    setRows(r => r.map(row => row.id === id ? { ...row, [col]: value } : row))
    const origItem = initialItems.find(sub => sub.id === id)
    if (origItem) {
      const origField = origItem.fields.find(f => f.label === (col === 'size' ? 'Size' : 'Count'))
      if (origField) onUpdateField(origField.id, { value: value || null })
    }
  }

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const addRow = () => setRows(r => [...r, { id: `fl_new_${Date.now()}`, size: '', count: '', isNew: true }])
  const confirmRemove = (id: string) => { setRows(r => r.filter(row => row.id !== id)); setPendingDeleteId(null) }

  return (
    <div className="rounded-xl border border-nav-gray overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#4a86c8]">
            <th className="text-left text-xs font-bold text-white px-4 py-2.5 w-1/2">
              <div className="flex items-center gap-2">
                <span>Size (Ø, in)</span>
                <span className="ml-auto text-[11px] text-white/50 font-normal">{rows.length} feedline{rows.length !== 1 ? 's' : ''}</span>
              </div>
            </th>
            <th className="text-left text-xs font-bold text-white px-4 py-2.5 w-1/2">Count</th>
            <th className="bg-[#4a86c8] w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-nav-gray/40 bg-white">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-5 text-center text-sm text-std-gray-dm italic">
                No feedlines recorded
              </td>
            </tr>
          ) : rows.map((row) => {
            const isPendingDelete = pendingDeleteId === row.id
            return (
              <tr key={row.id} className={clsx('group transition-colors', isPendingDelete ? 'bg-red-600/5' : 'hover:bg-hover-gray-lm')}>
                <td className={clsx('px-4 py-2.5 text-left', isPendingDelete && 'bg-red-600/5')}>
                  {isPendingDelete ? (
                    <span className="text-sm font-semibold text-red-600">Remove {row.size || '—'}?</span>
                  ) : (
                    <input
                      type="text"
                      value={row.size}
                      onChange={e => updateRow(row.id, 'size', e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                      autoFocus={row.isNew}
                      className="w-full text-sm text-black bg-transparent outline-none focus:bg-teal-400/5 focus:ring-1 focus:ring-teal-400/40 rounded px-1 py-0.5 transition-colors"
                      placeholder="—"
                    />
                  )}
                </td>
                <td className={clsx('px-4 py-2.5 text-left', isPendingDelete && 'bg-red-600/5')}>
                  {isPendingDelete ? (
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => confirmRemove(row.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
                      >
                        Remove
                      </button>
                      <button
                        onClick={() => setPendingDeleteId(null)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-nav-gray text-std-gray-lm hover:bg-hover-gray-lm transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <input
                      type="number"
                      value={row.count}
                      onChange={e => updateRow(row.id, 'count', e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                      className="w-full text-sm text-black bg-transparent outline-none focus:bg-teal-400/5 focus:ring-1 focus:ring-teal-400/40 rounded px-1 py-0.5 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none transition-colors"
                      placeholder="0"
                    />
                  )}
                </td>
                <td className={clsx('text-center w-10', isPendingDelete && 'bg-red-600/5')}>
                  {!isPendingDelete && (
                    <button
                      onClick={() => setPendingDeleteId(row.id)}
                      className="p-1.5 rounded-lg text-std-gray-dm opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-600/8 transition-all mx-auto"
                      title="Remove feedline"
                    >
                      <Minus size={12} />
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="px-4 py-2.5 border-t border-nav-gray/40">
              <button onClick={addRow} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 hover:text-indigo-600 transition-colors">
                <Plus size={12} /> Add Feedline
              </button>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function PhotoField({ field }: { field: SurveyField }) {
  if (field.value) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-16 h-12 rounded-lg bg-bg-gray-lm border border-nav-gray flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
          <Image size={18} className="text-std-gray-lm" />
        </div>
        <div>
          <p className="text-xs text-blue-400 hover:underline cursor-pointer font-medium">{field.value}</p>
          <button className="text-[11px] text-std-gray-lm hover:text-black mt-0.5 flex items-center gap-1"><Plus size={10} /> Add another</button>
        </div>
      </div>
    )
  }
  return (
    <button className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-nav-gray text-sm text-std-gray-lm hover:border-teal-400 hover:text-teal-400 hover:bg-teal-400/5 transition-colors">
      <Plus size={14} /> Upload photo
    </button>
  )
}

function PhotoCountBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="flex items-center gap-1 text-xs text-std-gray-lm bg-bg-gray-lm rounded-full px-2 py-0.5 border border-nav-gray">
      <Image size={11} /> {count}
    </span>
  )
}
