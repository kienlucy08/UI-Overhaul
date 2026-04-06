import { useState } from 'react'
import {
  Flag, Sparkles, CheckCheck, Check, Plus, Minus, Trash2, Pencil, ArrowUpRight,
  Search, Filter, Upload, MapPin, Star, QrCode, Paperclip, Calendar,
  Clock, Ruler, ChevronDown, X, Image, AlertTriangle, Info, Loader2,
  MoreHorizontal, Camera, FileImage, Grid3x3, Columns2, ZoomIn
} from 'lucide-react'
import clsx from 'clsx'

// ─── Shared demo helpers ───────────────────────────────────────────────────────

function Section({ id, title, description, children }: {
  id: string; title: string; description?: string; children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-6">
      <div className="mb-5">
        <h2 className="text-base font-bold text-black">{title}</h2>
        {description && <p className="text-sm text-std-gray-lm mt-0.5">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-xs font-bold text-std-gray-lm uppercase tracking-widest mb-3">{title}</h3>
      {children}
    </div>
  )
}

function DemoCard({ label, children, planned }: { label: string; children: React.ReactNode; planned?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-nav-gray p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-std-gray-lm">{label}</span>
        {planned && (
          <span className="text-[10px] font-semibold text-purple-600 bg-purple-600/10 border border-purple-600/20 rounded-full px-2 py-0.5">Planned</span>
        )}
      </div>
      {children}
    </div>
  )
}

// ─── Field-type demo wrappers ──────────────────────────────────────────────────

function FieldDemo({ label, required, flagged, marked, aiSeverity, children }: {
  label: string
  required?: boolean
  flagged?: boolean
  marked?: boolean
  aiSeverity?: 'error' | 'warning' | 'suggestion'
  children: React.ReactNode
}) {
  const [isFlagged, setIsFlagged] = useState(flagged ?? false)
  const [isMarked, setIsMarked] = useState(marked ?? false)

  const aiStyle = aiSeverity ? {
    error:      { badge: 'text-red-600 bg-red-600/10 border-red-600/20',     row: 'bg-red-600/[0.03]',    insight: 'bg-red-600/5 border-red-600/20',    icon: 'text-red-600',    label: 'AI Issue' },
    warning:    { badge: 'text-amber-600 bg-amber-500/10 border-amber-500/20', row: 'bg-amber-500/[0.03]', insight: 'bg-amber-500/5 border-amber-500/20', icon: 'text-amber-600', label: 'AI Warning' },
    suggestion: { badge: 'text-purple-600 bg-purple-600/10 border-purple-600/20', row: 'bg-purple-600/[0.03]', insight: 'bg-purple-600/5 border-purple-600/20', icon: 'text-purple-600', label: 'AI Suggestion' },
  }[aiSeverity] : null

  return (
    <div className={clsx(
      'px-5 py-3.5 rounded-lg border transition-colors',
      isFlagged ? 'bg-red-600/[0.04] border-red-600/25' : isMarked ? 'bg-green-600/[0.04] border-green-600/20' : aiStyle ? `${aiStyle.row} border-nav-gray` : 'bg-white border-nav-gray'
    )}>
      {/* Label row */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-sm font-semibold text-black">{label}</span>
        {required && <span className="text-[10px] font-semibold text-red-600 bg-red-600/8 border border-red-600/15 rounded-full px-2 py-0.5">Required</span>}
        {isFlagged && <span className="text-[10px] font-semibold text-red-600 bg-red-600/10 border border-red-600/20 rounded-full px-2 py-0.5 flex items-center gap-1"><Flag size={9} /> Flagged</span>}
        {isMarked && <span className="text-[10px] font-semibold text-green-600 bg-green-600/10 border border-green-600/20 rounded-full px-2 py-0.5 flex items-center gap-1"><Check size={9} /> Reviewed</span>}
        {aiSeverity && aiStyle && (
          <span className={clsx('inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5 border', aiStyle.badge)}>
            <Sparkles size={9} /> {aiStyle.label}
          </span>
        )}
      </div>

      {/* Input + actions */}
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">{children}</div>
        <button
          onClick={() => { if (!isMarked) setIsFlagged(f => !f) }}
          className={clsx('p-1.5 rounded-lg transition-colors flex-shrink-0 border', isFlagged ? 'text-red-600 bg-red-600/10 border-red-600/30' : 'text-std-gray-lm border-nav-gray hover:text-red-600 hover:bg-red-600/8')}
        >
          <Flag size={13} />
        </button>
        <button
          onClick={() => setIsMarked(m => !m)}
          className={clsx('p-1.5 rounded-lg transition-colors flex-shrink-0 border', isMarked ? 'text-green-600 bg-green-600/10 border-green-600/30' : 'text-std-gray-lm border-nav-gray hover:text-green-600 hover:bg-green-600/8')}
        >
          <Check size={13} />
        </button>
      </div>

      {/* AI insight */}
      {aiSeverity && aiStyle && (
        <div className={clsx('mt-2.5 p-2.5 rounded-lg border flex items-start gap-2', aiStyle.insight)}>
          <Sparkles size={11} className={clsx('flex-shrink-0 mt-0.5', aiStyle.icon)} />
          <div>
            <p className={clsx('text-[11px] font-semibold', aiStyle.icon)}>{aiStyle.label}</p>
            <p className="text-xs text-std-gray-lm mt-0.5 leading-relaxed">
              {aiSeverity === 'error' && 'Required field has no value. Must be completed before finalizing the survey.'}
              {aiSeverity === 'warning' && 'Manually flagged. AI recommends cross-referencing this value against site documentation before approving.'}
              {aiSeverity === 'suggestion' && 'Value may differ from last inspection. Verify against tower records.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Individual field type inputs ─────────────────────────────────────────────

function TextInput({ placeholder = 'Enter value…', value: init = '' }: { placeholder?: string; value?: string }) {
  const [v, setV] = useState(init)
  return (
    <input value={v} onChange={e => setV(e.target.value)} placeholder={placeholder}
      className="w-full px-3 py-2 text-sm bg-bg-gray-lm border border-nav-gray rounded-lg text-black placeholder-std-gray-dm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-colors" />
  )
}

function NumberInput({ unit }: { unit?: string }) {
  const [v, setV] = useState('')
  const step = (delta: number) => setV(s => String((Number(s) || 0) + delta))
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 flex items-center bg-bg-gray-lm border border-nav-gray rounded-lg overflow-hidden focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-400/20 transition-colors">
        <button onClick={() => step(-1)} className="px-2.5 py-2 text-std-gray-lm hover:text-black hover:bg-hover-gray-lm transition-colors flex-shrink-0 border-r border-nav-gray">
          <Minus size={13} />
        </button>
        <input type="number" value={v} onChange={e => setV(e.target.value)} placeholder="0"
          className="flex-1 px-3 py-2 text-sm bg-transparent text-black text-center placeholder-std-gray-dm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
        <button onClick={() => step(1)} className="px-2.5 py-2 text-std-gray-lm hover:text-black hover:bg-hover-gray-lm transition-colors flex-shrink-0 border-l border-nav-gray">
          <Plus size={13} />
        </button>
      </div>
      {unit && <span className="text-sm text-std-gray-lm font-medium flex-shrink-0">{unit}</span>}
    </div>
  )
}

function TextareaInput() {
  const [v, setV] = useState('')
  return (
    <textarea value={v} onChange={e => setV(e.target.value)} placeholder="Enter notes…" rows={3}
      className="w-full px-3 py-2 text-sm bg-bg-gray-lm border border-nav-gray rounded-lg text-black placeholder-std-gray-dm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-colors resize-none" />
  )
}

function YesNoInput({ value: init = null }: { value?: 'Yes' | 'No' | null }) {
  const [v, setV] = useState<'Yes' | 'No' | null>(init)
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => setV(v === 'Yes' ? null : 'Yes')}
        className={clsx('px-5 py-1.5 rounded-full text-sm font-semibold border-2 transition-all',
          v === 'Yes' ? 'bg-teal-400 text-white border-teal-400 shadow-sm' : 'bg-white text-std-gray-lm border-nav-gray hover:border-teal-400/50 hover:text-teal-600'
        )}>Yes</button>
      <button onClick={() => setV(v === 'No' ? null : 'No')}
        className={clsx('px-5 py-1.5 rounded-full text-sm font-semibold border-2 transition-all',
          v === 'No' ? 'bg-sidebar text-white border-sidebar shadow-sm' : 'bg-white text-std-gray-lm border-nav-gray hover:border-std-gray-lm hover:text-black'
        )}>No</button>
      {v && <button onClick={() => setV(null)} className="p-1 text-std-gray-lm hover:text-black transition-colors"><X size={14} /></button>}
    </div>
  )
}

function SelectInput({ options, placeholder = '— Select —' }: { options: string[]; placeholder?: string }) {
  const [open, setOpen] = useState(false)
  const [v, setV] = useState<string | null>(null)
  return (
    <div>
      <button onClick={() => setOpen(o => !o)}
        className={clsx('w-full flex items-center justify-between px-3 py-2 bg-white border rounded-lg text-sm transition-colors hover:border-teal-300',
          open ? 'border-indigo-500/40 ring-2 ring-indigo-500/10' : 'border-nav-gray'
        )}>
        <span className={v ? 'text-black' : 'text-std-gray-dm italic'}>{v ?? placeholder}</span>
        <ChevronDown size={13} className={clsx('text-std-gray-lm transition-transform duration-150', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="mt-1 bg-white border border-nav-gray rounded-xl shadow-sm p-2.5">
          <div className="flex flex-wrap gap-1.5">
            {options.map(opt => (
              <button key={opt} onClick={() => { setV(opt); setOpen(false) }}
                className={clsx('px-3 py-1 rounded-full text-xs font-semibold border transition-all',
                  v === opt ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-indigo-500/8 text-indigo-500 border-indigo-500/25 hover:bg-indigo-500 hover:text-white'
                )}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MultiSelectInput({ options }: { options: string[] }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const toggle = (opt: string) => setSelected(prev => { const n = new Set(prev); n.has(opt) ? n.delete(opt) : n.add(opt); return n })
  const sel = Array.from(selected)
  return (
    <div>
      <button onClick={() => setOpen(o => !o)}
        className={clsx('w-full flex items-center justify-between px-3 py-2 bg-white border rounded-lg text-sm transition-colors hover:border-teal-300 min-h-[38px]',
          open ? 'border-indigo-500/40 ring-2 ring-indigo-500/10' : 'border-nav-gray'
        )}>
        <div className="flex-1 flex items-center gap-1 flex-wrap">
          {sel.length === 0
            ? <span className="text-std-gray-dm italic">— Select all that apply —</span>
            : sel.map(s => (
              <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500 text-white">
                {s}
                <button onClick={e => { e.stopPropagation(); toggle(s) }} className="hover:opacity-70 transition-opacity"><X size={10} /></button>
              </span>
            ))
          }
        </div>
        <ChevronDown size={13} className={clsx('text-std-gray-lm transition-transform duration-150 flex-shrink-0 ml-2', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="mt-1 bg-white border border-nav-gray rounded-xl shadow-sm p-2.5">
          <div className="flex flex-wrap gap-1.5">
            {options.map(opt => (
              <button key={opt} onClick={() => toggle(opt)}
                className={clsx('px-3 py-1 rounded-full text-xs font-semibold border transition-all',
                  selected.has(opt) ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-indigo-500/8 text-indigo-500 border-indigo-500/25 hover:bg-indigo-500 hover:text-white'
                )}>
                {selected.has(opt) && <Check size={9} className="inline mr-1 mb-0.5" />}
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function RadioInput({ options }: { options: string[] }) {
  const [v, setV] = useState<string | null>(null)
  return (
    <div className="flex flex-col gap-2">
      {options.map(opt => (
        <button key={opt} onClick={() => setV(opt)}
          className={clsx('flex items-center gap-2.5 text-sm px-3 py-2 rounded-lg border transition-colors text-left',
            v === opt ? 'border-teal-400/40 bg-teal-400/8 text-teal-700' : 'border-nav-gray bg-bg-gray-lm text-black hover:border-teal-400/30'
          )}>
          <div className={clsx('w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
            v === opt ? 'border-teal-400 bg-teal-400' : 'border-nav-gray'
          )}>
            {v === opt && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
          </div>
          {opt}
        </button>
      ))}
    </div>
  )
}

function DateInput() {
  const [v, setV] = useState('')
  return (
    <div className="relative">
      <input type="date" value={v} onChange={e => setV(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-bg-gray-lm border border-nav-gray rounded-lg text-black outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-colors" />
      <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-std-gray-lm pointer-events-none" />
    </div>
  )
}

function DateTimeInput() {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-bg-gray-lm border border-nav-gray rounded-lg text-black outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-colors" />
        <Calendar size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-std-gray-lm pointer-events-none" />
      </div>
      <div className="relative flex-1">
        <input type="time" value={time} onChange={e => setTime(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-bg-gray-lm border border-nav-gray rounded-lg text-black outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-colors" />
        <Clock size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-std-gray-lm pointer-events-none" />
      </div>
    </div>
  )
}

function MeasurementInput() {
  const [v, setV] = useState('')
  const [unit, setUnit] = useState('ft')
  const units = ['ft', 'in', 'm', 'cm', 'mm', 'yd']
  return (
    <div className="flex gap-2">
      <input type="number" value={v} onChange={e => setV(e.target.value)} placeholder="0.00"
        className="flex-1 px-3 py-2 text-sm bg-bg-gray-lm border border-nav-gray rounded-lg text-black placeholder-std-gray-dm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-colors" />
      <select value={unit} onChange={e => setUnit(e.target.value)}
        className="px-2 py-2 text-sm bg-bg-gray-lm border border-nav-gray rounded-lg text-black outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-colors">
        {units.map(u => <option key={u}>{u}</option>)}
      </select>
    </div>
  )
}

function RatingInput({ max = 5 }: { max?: number }) {
  const [v, setV] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <button key={i} onClick={() => setV(i + 1)}
          className={clsx('transition-colors', i < v ? 'text-amber-400' : 'text-nav-gray hover:text-amber-300')}>
          <Star size={22} fill={i < v ? 'currentColor' : 'none'} />
        </button>
      ))}
      {v > 0 && <span className="text-xs text-std-gray-lm ml-2 font-medium">{v}/{max}</span>}
    </div>
  )
}

function ScoreInput() {
  const [v, setV] = useState<number | null>(null)
  const scores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  return (
    <div className="flex gap-1.5 flex-wrap">
      {scores.map(s => (
        <button key={s} onClick={() => setV(s)}
          className={clsx('w-9 h-9 rounded-lg text-sm font-bold border-2 transition-colors',
            v === s
              ? s <= 3 ? 'bg-red-600 border-red-600 text-white' : s <= 6 ? 'bg-amber-500 border-amber-500 text-white' : 'bg-green-600 border-green-600 text-white'
              : 'border-nav-gray bg-bg-gray-lm text-std-gray-lm hover:border-teal-400/50'
          )}>
          {s}
        </button>
      ))}
    </div>
  )
}

function LocationInput() {
  const [captured, setCaptured] = useState(false)
  return (
    <div className="flex items-center gap-2">
      {captured ? (
        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-green-600/8 border border-green-600/25 rounded-lg">
          <MapPin size={14} className="text-green-600 flex-shrink-0" />
          <span className="text-sm text-green-700 font-mono">32.7767° N, 96.7970° W</span>
          <button onClick={() => setCaptured(false)} className="ml-auto text-std-gray-lm hover:text-black"><X size={13} /></button>
        </div>
      ) : (
        <button onClick={() => setCaptured(true)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-bg-gray-lm border border-nav-gray border-dashed rounded-lg text-sm text-std-gray-lm hover:border-teal-400/50 hover:text-teal-600 transition-colors">
          <MapPin size={14} /> Capture GPS Location
        </button>
      )}
    </div>
  )
}

function BarcodeInput() {
  const [v, setV] = useState('')
  return (
    <div className="flex items-center gap-2">
      <input value={v} onChange={e => setV(e.target.value)} placeholder="Scan or enter code…"
        className="flex-1 px-3 py-2 text-sm bg-bg-gray-lm border border-nav-gray rounded-lg text-black font-mono placeholder-std-gray-dm outline-none focus:border-teal-400 transition-colors" />
      <button className="p-2.5 rounded-lg border border-nav-gray hover:bg-hover-gray-lm text-std-gray-lm hover:text-black transition-colors flex-shrink-0">
        <QrCode size={16} />
      </button>
    </div>
  )
}

function AttachmentInput() {
  const [files, setFiles] = useState<string[]>([])
  return (
    <div className="space-y-2">
      {files.map(f => (
        <div key={f} className="flex items-center gap-2 px-3 py-2 bg-bg-gray-lm border border-nav-gray rounded-lg">
          <Paperclip size={13} className="text-std-gray-lm flex-shrink-0" />
          <span className="text-sm text-black flex-1 truncate">{f}</span>
          <button onClick={() => setFiles(prev => prev.filter(x => x !== f))} className="text-std-gray-lm hover:text-red-600 transition-colors"><X size={13} /></button>
        </div>
      ))}
      <button onClick={() => setFiles(prev => [...prev, `attachment_${prev.length + 1}.pdf`])}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-bg-gray-lm border border-nav-gray border-dashed rounded-lg text-sm text-std-gray-lm hover:border-teal-400/50 hover:text-teal-600 transition-colors">
        <Paperclip size={14} /> Attach File
      </button>
    </div>
  )
}

function SignatureInput() {
  const [signed, setSigned] = useState(false)
  return (
    <div onClick={() => setSigned(true)}
      className={clsx('h-20 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors',
        signed ? 'border-green-600/30 bg-green-600/5' : 'border-nav-gray hover:border-teal-400/50'
      )}>
      {signed ? (
        <div className="text-center">
          <span className="font-script text-2xl text-std-gray-lm italic" style={{ fontFamily: 'cursive' }}>S. Fagan</span>
          <p className="text-[10px] text-green-600 mt-0.5">Signed</p>
        </div>
      ) : (
        <p className="text-sm text-std-gray-lm">Click to sign</p>
      )}
    </div>
  )
}

// ─── Photo field types ─────────────────────────────────────────────────────────

function PhotoField({ label, required }: { label: string; required?: boolean }) {
  const [photos, setPhotos] = useState<string[]>([])
  const add = () => setPhotos(p => [...p, `photo_${String(p.length + 1).padStart(3, '0')}.jpg`])
  const remove = (i: number) => setPhotos(p => p.filter((_, idx) => idx !== i))
  return (
    <div className="space-y-2">
      {photos.map((filename, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-16 h-12 rounded-lg bg-bg-gray-lm border border-nav-gray flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0">
            <Image size={18} className="text-std-gray-lm" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-blue-400 hover:underline cursor-pointer font-medium truncate">{filename}</p>
            <button onClick={() => remove(i)} className="text-[11px] text-std-gray-lm hover:text-red-600 mt-0.5 flex items-center gap-1 transition-colors">
              <Trash2 size={10} /> Remove
            </button>
          </div>
        </div>
      ))}
      <button onClick={add}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-nav-gray text-sm text-std-gray-lm hover:border-teal-400 hover:text-teal-400 hover:bg-teal-400/5 transition-colors">
        <Camera size={14} />
        {photos.length === 0
          ? <span>{required ? 'Tap to take photo' : 'Tap to take photo'}</span>
          : <span>Add another</span>
        }
      </button>
    </div>
  )
}

type DemoPhotoSlot = { id: string; filename: string | null; flagged: boolean; marked: boolean }
type DemoPhotoGroup = { id: string; label: string; required: boolean; slots: DemoPhotoSlot[] }

function makeDemoSlot(id: string, filename: string | null = null): DemoPhotoSlot {
  return { id, filename, flagged: false, marked: !!filename }
}
function makeDemoGroup(id: string, label: string, count = 3, required = false, preloaded = 0): DemoPhotoGroup {
  return {
    id, label, required,
    slots: Array.from({ length: count }, (_, i) =>
      makeDemoSlot(`${id}_s${i}`, i < preloaded ? `${id}_photo_${String(i + 1).padStart(2, '0')}.jpg` : null)
    ),
  }
}

function PhotoGroupCard({
  group,
  onToggleSlot,
  onAddSlot,
  onToggleFlag,
}: {
  group: DemoPhotoGroup
  onToggleSlot: (slotId: string) => void
  onAddSlot: () => void
  onToggleFlag: (slotId: string) => void
}) {
  const filled  = group.slots.filter(s => s.filename !== null).length
  const flagged = group.slots.filter(s => s.flagged).length
  return (
    <div className="rounded-xl border border-nav-gray bg-white overflow-hidden">
      <div className="px-4 py-2.5 bg-bg-gray-lm/60 border-b border-nav-gray/40 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-black">{group.label}</p>
          <p className="text-[10px] text-std-gray-lm mt-0.5">
            {filled} of {group.slots.length} photos
            {group.required && <span className="ml-1.5 text-red-600 font-semibold">· Required</span>}
            {flagged > 0 && <span className="ml-1.5 text-red-600 font-semibold">· {flagged} flagged</span>}
          </p>
        </div>
        {filled > 0 && filled === group.slots.length && (
          <span className="w-5 h-5 rounded-full bg-green-600/15 flex items-center justify-center flex-shrink-0">
            <Check size={10} className="text-green-600" />
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="grid grid-cols-3 gap-2.5">
          {group.slots.map(slot => (
            <div key={slot.id} className="relative group/slot">
              <div
                onClick={() => onToggleSlot(slot.id)}
                className={clsx(
                  'aspect-[4/3] rounded-lg border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 relative overflow-hidden',
                  slot.flagged   ? 'border-red-600/40 bg-red-600/5' :
                  slot.filename  ? 'border-green-600/30 bg-gradient-to-br from-slate-100 to-slate-200 hover:opacity-90' :
                  'border-dashed border-nav-gray hover:border-teal-400/60 hover:bg-teal-400/5'
                )}
              >
                {slot.filename ? (
                  <>
                    <FileImage size={22} className="text-teal-400/60" />
                    <p className="text-[10px] text-std-gray-lm text-center leading-tight px-1 truncate w-full">{slot.filename}</p>
                    {slot.marked && <Check size={13} className="absolute top-1.5 right-1.5 text-green-600 bg-white rounded-full p-0.5 shadow-sm" />}
                  </>
                ) : (
                  <>
                    <Camera size={18} className="text-std-gray-dm" />
                    <p className="text-[10px] text-std-gray-dm">Add photo</p>
                  </>
                )}
              </div>
              {slot.filename && (
                <button
                  onClick={() => onToggleFlag(slot.id)}
                  className={clsx(
                    'absolute top-1.5 left-1.5 p-1 rounded-md opacity-0 group-hover/slot:opacity-100 transition-all border',
                    slot.flagged ? 'bg-red-600/10 border-red-600/30 text-red-600 opacity-100' : 'bg-white/80 border-nav-gray text-std-gray-lm hover:text-red-600'
                  )}
                >
                  <Flag size={10} />
                </button>
              )}
            </div>
          ))}
          {/* Add slot */}
          <button
            onClick={onAddSlot}
            className="aspect-[4/3] rounded-lg border-2 border-dashed border-nav-gray flex flex-col items-center justify-center gap-1.5 text-std-gray-dm hover:border-teal-400/60 hover:text-teal-500 hover:bg-teal-400/5 transition-all"
          >
            <Plus size={16} />
            <p className="text-[10px]">Add</p>
          </button>
        </div>
      </div>
    </div>
  )
}

function PhotoGroupCardDemo({ label, required, preloaded, count }: { label: string; required?: boolean; preloaded?: number; count?: number }) {
  const [group, setGroup] = useState<DemoPhotoGroup>(() => makeDemoGroup('demo', label, count ?? 3, required ?? false, preloaded ?? 0))

  function toggleSlot(slotId: string) {
    setGroup(prev => ({
      ...prev,
      slots: prev.slots.map(s => s.id === slotId
        ? s.filename ? { ...s, filename: null, marked: false } : { ...s, filename: `photo_${String(prev.slots.findIndex(x => x.id === slotId) + 1).padStart(2, '0')}.jpg`, marked: true }
        : s
      ),
    }))
  }
  function addSlot() {
    setGroup(prev => ({ ...prev, slots: [...prev.slots, makeDemoSlot(`demo_s${prev.slots.length}_${Date.now()}`)] }))
  }
  function toggleFlag(slotId: string) {
    setGroup(prev => ({ ...prev, slots: prev.slots.map(s => s.id === slotId ? { ...s, flagged: !s.flagged } : s) }))
  }

  return <PhotoGroupCard group={group} onToggleSlot={toggleSlot} onAddSlot={addSlot} onToggleFlag={toggleFlag} />
}

// ─── Button demos ──────────────────────────────────────────────────────────────

function ButtonRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>
}

// ─── Badge demos ───────────────────────────────────────────────────────────────

function BadgeGroup({ items }: { items: { label: string; className: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(({ label, className }) => (
        <span key={label} className={clsx('badge border text-xs', className)}>{label}</span>
      ))}
    </div>
  )
}

// ─── Table demo ────────────────────────────────────────────────────────────────

const tableRows = [
  { id: 'SIT-001', name: 'Mango Site', owner: 'Samuel Fagan', status: 'active',   visits: 12, selected: false },
  { id: 'SIT-002', name: 'Claybar',    owner: 'Lucy Kien',    status: 'active',   visits: 8,  selected: true  },
  { id: 'SIT-003', name: 'Oak Ridge',  owner: 'J. Torres',    status: 'inactive', visits: 3,  selected: false },
]

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ComponentLibraryPage() {
  const [activeSection, setActiveSection] = useState('field-types')

  const navLinks = [
    { id: 'field-types',  label: 'Field Types' },
    { id: 'field-states', label: 'Field States' },
    { id: 'photo-cop',    label: 'Photo / COP' },
    { id: 'buttons',      label: 'Buttons' },
    { id: 'badges',       label: 'Badges & Status' },
    { id: 'tables',       label: 'Tables' },
    { id: 'qc-table',     label: 'QC Data Table' },
  ]

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveSection(id)
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sticky left nav */}
      <aside className="w-44 flex-shrink-0 bg-white border-r border-nav-gray py-5 px-3 overflow-y-auto">
        <p className="text-[10px] font-bold text-std-gray-lm uppercase tracking-widest px-2 mb-3">Components</p>
        <nav className="space-y-0.5">
          {navLinks.map(({ id, label }) => (
            <button key={id} onClick={() => scrollTo(id)}
              className={clsx('w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                activeSection === id ? 'bg-teal-400/15 text-teal-700 font-semibold' : 'text-std-gray-lm hover:bg-hover-gray-lm hover:text-black'
              )}>
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto bg-bg-gray-lm/40">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-12">

          {/* Page header */}
          <div>
            <h1 className="text-xl font-bold text-black">Component Library</h1>
            <p className="text-sm text-std-gray-lm mt-1">All field types, UI components, and patterns used across FieldSync QC workflows.</p>
          </div>

          {/* ── Field Types ── */}
          <Section id="field-types" title="Field Types" description="All data capture types for QC survey fields.">

            <SubSection title="Current — Text & Input">
              <div className="grid gap-3">
                <DemoCard label="text">
                  <FieldDemo label="Power Provider"><TextInput placeholder="Enter provider name…" value="Emepa" /></FieldDemo>
                </DemoCard>
                <DemoCard label="number">
                  <FieldDemo label="Road Width"><NumberInput unit="ft" /></FieldDemo>
                </DemoCard>
                <DemoCard label="textarea">
                  <FieldDemo label="Description"><TextareaInput /></FieldDemo>
                </DemoCard>
              </div>
            </SubSection>

            <SubSection title="Current — Selection">
              <div className="grid gap-3">
                <DemoCard label="yesno">
                  <FieldDemo label="Access Road Present"><YesNoInput value="Yes" /></FieldDemo>
                </DemoCard>
                <DemoCard label="select">
                  <FieldDemo label="Road Surface Type"><SelectInput options={['Gravel', 'Paved', 'Dirt', 'Grass']} /></FieldDemo>
                </DemoCard>
              </div>
            </SubSection>

            <SubSection title="Planned — Extended Selection">
              <div className="grid gap-3">
                <DemoCard label="multiselect" planned>
                  <FieldDemo label="Equipment Present">
                    <MultiSelectInput options={['Generator', 'Cabinet', 'Battery', 'Ice Bridge', 'Conduit', 'Lighting']} />
                  </FieldDemo>
                </DemoCard>
                <DemoCard label="radio" planned>
                  <FieldDemo label="Overall Condition">
                    <RadioInput options={['Good', 'Fair', 'Poor', 'Critical']} />
                  </FieldDemo>
                </DemoCard>
              </div>
            </SubSection>

            <SubSection title="Planned — Date & Time">
              <div className="grid gap-3">
                <DemoCard label="date" planned>
                  <FieldDemo label="Inspection Date"><DateInput /></FieldDemo>
                </DemoCard>
                <DemoCard label="datetime" planned>
                  <FieldDemo label="Last Service Date + Time"><DateTimeInput /></FieldDemo>
                </DemoCard>
              </div>
            </SubSection>

            <SubSection title="Planned — Measurement & Scoring">
              <div className="grid gap-3">
                <DemoCard label="measurement" planned>
                  <FieldDemo label="Tower Height"><MeasurementInput /></FieldDemo>
                </DemoCard>
                <DemoCard label="rating" planned>
                  <FieldDemo label="Site Access Rating"><RatingInput max={5} /></FieldDemo>
                </DemoCard>
                <DemoCard label="score" planned>
                  <FieldDemo label="Structural Integrity Score">
                    <ScoreInput />
                  </FieldDemo>
                </DemoCard>
              </div>
            </SubSection>

            <SubSection title="Planned — Capture & Utility">
              <div className="grid gap-3">
                <DemoCard label="location" planned>
                  <FieldDemo label="Site GPS Coordinates"><LocationInput /></FieldDemo>
                </DemoCard>
                <DemoCard label="barcode" planned>
                  <FieldDemo label="Equipment Serial Number"><BarcodeInput /></FieldDemo>
                </DemoCard>
                <DemoCard label="attachment" planned>
                  <FieldDemo label="Supporting Documents"><AttachmentInput /></FieldDemo>
                </DemoCard>
                <DemoCard label="signature" planned>
                  <FieldDemo label="Technician Sign-off"><SignatureInput /></FieldDemo>
                </DemoCard>
              </div>
            </SubSection>
          </Section>

          {/* ── Field States ── */}
          <Section id="field-states" title="Field States" description="How any field looks across all possible states.">
            <div className="grid gap-3">
              <FieldDemo label="Default — no value"><TextInput placeholder="Enter value…" /></FieldDemo>
              <FieldDemo label="Has Value"><TextInput value="Emepa Electric Co." /></FieldDemo>
              <FieldDemo label="Required — no value" required><TextInput placeholder="Required field…" /></FieldDemo>
              <FieldDemo label="Flagged" flagged><TextInput value="ATT-0042" /></FieldDemo>
              <FieldDemo label="Marked / Reviewed" marked><TextInput value="Gravel" /></FieldDemo>
              <FieldDemo label="AI Error" aiSeverity="error" required><TextInput placeholder="Required — no value" /></FieldDemo>
              <FieldDemo label="AI Warning" aiSeverity="warning"><TextInput value="Lock Present" /></FieldDemo>
              <FieldDemo label="AI Suggestion" aiSeverity="suggestion"><TextInput value="Yes" /></FieldDemo>
            </div>
          </Section>

          {/* ── Photo / COP ── */}
          <Section id="photo-cop" title="Photo / COP Workflow" description="Image-heavy survey patterns for Compound Overview Photo (COP) surveys.">

            <SubSection title="Current — Single Photo Field (type: photo)">
              <div className="grid sm:grid-cols-2 gap-4">
                <PhotoField label="Overview Photo" required />
                <PhotoField label="Gate Photo" required />
              </div>
            </SubSection>

            <SubSection title="COP — Photo Group Card (3-up, empty)">
              <PhotoGroupCardDemo label="Compound Exterior Photos" count={3} />
            </SubSection>

            <SubSection title="COP — Photo Group Card (3-up, partially filled)">
              <PhotoGroupCardDemo label="Existing Overall View" count={4} preloaded={3} />
            </SubSection>

            <SubSection title="COP — Photo Group Card (required, empty)">
              <PhotoGroupCardDemo label="Tower Face Photos" count={3} required />
            </SubSection>

            <SubSection title="COP — Mixed Section (Photos + Fields)">
              <div className="bg-white rounded-xl border border-nav-gray overflow-hidden">
                {/* Sticky section header mock */}
                <div className="bg-bg-gray-lm/80 border-b border-nav-gray/40 px-5 py-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-teal-900">Compound Gate</h3>
                    <p className="text-xs text-std-gray-lm mt-0.5">0 of 4 fields checked</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-bg-gray-lm rounded-full overflow-hidden border border-nav-gray">
                      <div className="h-full w-0 bg-teal-300 rounded-full" />
                    </div>
                    <span className="text-xs font-bold text-teal-400">0%</span>
                  </div>
                </div>
                <div className="divide-y divide-nav-gray/30 px-5 py-4 space-y-4">
                  <PhotoField label="Gate Overview Photo" required />
                  <div className="pt-4">
                    <FieldDemo label="Gate Condition"><SelectInput options={['Good', 'Fair', 'Poor', 'Missing']} /></FieldDemo>
                  </div>
                  <div className="pt-4">
                    <FieldDemo label="Lock Present"><YesNoInput /></FieldDemo>
                  </div>
                  <div className="pt-4">
                    <PhotoField label="Lock Close-Up Photo" />
                  </div>
                </div>
              </div>
            </SubSection>
          </Section>

          {/* ── Buttons ── */}
          <Section id="buttons" title="Buttons" description="All button variants and states.">

            <SubSection title="Variants">
              <div className="space-y-3">
                <ButtonRow>
                  <button className="btn-primary">Primary</button>
                  <button className="btn-secondary">Secondary</button>
                  <button className="btn-success">Success</button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">Danger</button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-nav-gray text-sm font-medium text-std-gray-lm hover:bg-hover-gray-lm transition-colors">Ghost</button>
                </ButtonRow>
              </div>
            </SubSection>

            <SubSection title="With Icons">
              <ButtonRow>
                <button className="btn-primary"><Plus size={14} /> New Site</button>
                <button className="btn-secondary"><Filter size={14} /> Filter</button>
                <button className="btn-success"><Check size={14} /> Mark Complete</button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"><Trash2 size={14} /> Delete</button>
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-nav-gray text-sm font-medium text-std-gray-lm hover:bg-hover-gray-lm transition-colors"><Upload size={14} /> Import</button>
              </ButtonRow>
            </SubSection>

            <SubSection title="Sizes">
              <ButtonRow>
                <button className="btn-primary text-xs px-2.5 py-1.5">Small</button>
                <button className="btn-primary text-sm">Medium</button>
                <button className="btn-primary text-base px-5 py-2.5">Large</button>
              </ButtonRow>
            </SubSection>

            <SubSection title="States">
              <ButtonRow>
                <button className="btn-primary">Normal</button>
                <button className="btn-primary opacity-60 cursor-not-allowed" disabled>Disabled</button>
                <button className="btn-primary flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Loading…
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600/10 border border-green-600/25 text-green-600 text-sm font-semibold cursor-default">
                  <CheckCheck size={14} /> Saved
                </button>
              </ButtonRow>
            </SubSection>

            <SubSection title="Icon-only">
              <ButtonRow>
                <button className="p-2 rounded-lg border border-nav-gray hover:bg-hover-gray-lm text-std-gray-lm hover:text-black transition-colors"><Search size={16} /></button>
                <button className="p-2 rounded-lg border border-nav-gray hover:bg-hover-gray-lm text-std-gray-lm hover:text-black transition-colors"><Filter size={16} /></button>
                <button className="p-2 rounded-lg border border-nav-gray hover:bg-hover-gray-lm text-std-gray-lm hover:text-black transition-colors"><Pencil size={16} /></button>
                <button className="p-2 rounded-lg border border-nav-gray hover:bg-red-600/8 text-std-gray-lm hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                <button className="p-2 rounded-lg border border-nav-gray hover:bg-hover-gray-lm text-std-gray-lm hover:text-black transition-colors"><MoreHorizontal size={16} /></button>
                <button className="p-2 rounded-lg bg-teal-400/15 border border-teal-400/30 text-teal-600 hover:bg-teal-400/25 transition-colors"><ArrowUpRight size={16} /></button>
              </ButtonRow>
            </SubSection>

            <SubSection title="Inline / Text Actions">
              <ButtonRow>
                <button className="text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors">View Details</button>
                <span className="text-nav-gray">·</span>
                <button className="text-sm text-std-gray-lm hover:text-black font-medium transition-colors">Edit</button>
                <span className="text-nav-gray">·</span>
                <button className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors">Delete</button>
              </ButtonRow>
            </SubSection>
          </Section>

          {/* ── Badges ── */}
          <Section id="badges" title="Badges & Status" description="Colored badges for status, severity, field metadata, and survey states.">

            <SubSection title="Survey / Record Status">
              <BadgeGroup items={[
                { label: 'Active',      className: 'bg-green-600/10 text-green-600 border-green-600/25' },
                { label: 'In Progress', className: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
                { label: 'Pending',     className: 'bg-blue-500/10 text-blue-600 border-blue-500/25' },
                { label: 'Complete',    className: 'bg-teal-400/10 text-teal-600 border-teal-400/25' },
                { label: 'Inactive',    className: 'bg-bg-gray-lm text-std-gray-lm border-nav-gray' },
                { label: 'Archived',    className: 'bg-bg-gray-lm text-std-gray-dm border-nav-gray' },
              ]} />
            </SubSection>

            <SubSection title="Severity & Alerts">
              <BadgeGroup items={[
                { label: 'Error',      className: 'bg-red-600/10 text-red-600 border-red-600/25' },
                { label: 'Warning',    className: 'bg-amber-500/10 text-amber-600 border-amber-500/25' },
                { label: 'Info',       className: 'bg-blue-500/10 text-blue-600 border-blue-500/25' },
                { label: 'Success',    className: 'bg-green-600/10 text-green-600 border-green-600/25' },
                { label: 'AI Issue',   className: 'bg-red-600/10 text-red-600 border-red-600/20' },
                { label: 'AI Warning', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
                { label: 'AI Suggestion', className: 'bg-purple-600/10 text-purple-600 border-purple-600/20' },
              ]} />
            </SubSection>

            <SubSection title="Field Metadata">
              <BadgeGroup items={[
                { label: 'Required', className: 'bg-red-600/8 text-red-600 border-red-600/15' },
                { label: 'Flagged',  className: 'bg-red-600/10 text-red-600 border-red-600/20' },
                { label: 'Reviewed', className: 'bg-green-600/10 text-green-600 border-green-600/20' },
                { label: 'Beta',     className: 'bg-purple-600/10 text-purple-600 border-purple-600/20' },
                { label: 'Planned',  className: 'bg-purple-600/10 text-purple-600 border-purple-600/20' },
                { label: 'New',      className: 'bg-teal-400/10 text-teal-600 border-teal-400/25' },
              ]} />
            </SubSection>

            <SubSection title="Priority">
              <BadgeGroup items={[
                { label: 'Critical', className: 'bg-red-600 text-white border-red-600' },
                { label: 'High',     className: 'bg-red-600/15 text-red-700 border-red-600/25' },
                { label: 'Medium',   className: 'bg-amber-500/15 text-amber-700 border-amber-500/25' },
                { label: 'Low',      className: 'bg-bg-gray-lm text-std-gray-lm border-nav-gray' },
              ]} />
            </SubSection>
          </Section>

          {/* ── Tables ── */}
          <Section id="tables" title="Tables" description="Table patterns used across list pages.">
            <div className="bg-white rounded-xl border border-nav-gray overflow-hidden">

              {/* Toolbar */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-nav-gray bg-hover-gray-lm/30 flex-wrap">
                <div className="flex items-center gap-2 bg-white border border-nav-gray rounded-lg px-3 py-2 w-52">
                  <Search size={13} className="text-std-gray-lm flex-shrink-0" />
                  <input placeholder="Filter…" className="bg-transparent text-sm text-black placeholder-std-gray-lm outline-none w-full" />
                </div>
                <button className="btn-secondary text-xs"><Filter size={13} /> Filter</button>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-teal-600 font-medium bg-teal-100/50 border border-teal-300/40 rounded-lg px-2.5 py-1.5">1 of 3 selected</span>
                  <button className="btn-primary text-xs"><Plus size={13} /> New Site</button>
                </div>
              </div>

              {/* Table */}
              <table className="w-full">
                <thead>
                  <tr className="border-b border-nav-gray bg-bg-gray-lm/60">
                    <th className="w-10 px-5 py-3">
                      <div className="w-4 h-4 rounded border-2 border-nav-gray hover:border-indigo-400 cursor-pointer" />
                    </th>
                    {['Name / State', 'Owner', 'Site ID', 'Visits', 'Status', ''].map(h => (
                      <th key={h} className="px-3 py-3 text-left">
                        {h && <button className="group flex items-center gap-1 text-xs font-semibold text-std-gray-lm uppercase tracking-wide hover:text-black transition-colors">
                          {h} <span className="text-transparent group-hover:text-std-gray-lm text-xs ml-0.5">↕</span>
                        </button>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-nav-gray/50">
                  {tableRows.map(row => (
                    <tr key={row.id} className={clsx('group hover:bg-hover-gray-lm transition-colors', row.selected && 'bg-teal-100/20')}>
                      <td className="px-5 py-3.5">
                        <div className={clsx('w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer', row.selected ? 'bg-indigo-500 border-indigo-500' : 'border-nav-gray')}>
                          {row.selected && <span className="text-white text-[10px] font-bold">✓</span>}
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <p className="text-sm font-medium text-black">{row.name}</p>
                        <p className="text-xs text-std-gray-lm">Texas</p>
                      </td>
                      <td className="px-3 py-3.5 text-sm text-black">{row.owner}</td>
                      <td className="px-3 py-3.5 text-sm text-std-gray-lm font-mono">{row.id}</td>
                      <td className="px-3 py-3.5 text-sm text-black">{row.visits}</td>
                      <td className="px-3 py-3.5">
                        <span className={clsx('badge border text-xs', row.status === 'active' ? 'bg-green-600/10 text-green-600 border-green-600/25' : 'bg-bg-gray-lm text-std-gray-lm border-nav-gray')}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-teal-400/10 text-teal-600 hover:bg-teal-400/20 transition-colors">
                            <ArrowUpRight size={13} /> View
                          </button>
                          <button className="p-1.5 rounded-lg text-std-gray-lm hover:bg-bg-gray-lm hover:text-black transition-colors border border-transparent hover:border-nav-gray">
                            <MoreHorizontal size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-nav-gray bg-bg-gray-lm/30 flex items-center justify-between">
                <p className="text-xs text-std-gray-lm">Showing 3 of 3 records</p>
                <div className="flex items-center gap-1">
                  {[1].map(p => (
                    <button key={p} className="w-7 h-7 rounded-lg text-xs font-medium bg-teal-400/15 text-teal-600 border border-teal-400/30">{p}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Empty state */}
            <div className="mt-4 bg-white rounded-xl border border-nav-gray py-14 text-center">
              <Info size={24} className="mx-auto mb-3 text-nav-gray" />
              <p className="text-sm font-medium text-black">No records found</p>
              <p className="text-xs text-std-gray-lm mt-1">Try adjusting your filters or search query.</p>
            </div>
          </Section>

          {/* ── QC Data Table ── */}
          <Section id="qc-table" title="QC Data Table" description="Blue-header table for deeply nested QC data, e.g. Guy Facilities wire entries.">
            <div className="bg-white rounded-xl border border-nav-gray overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="bg-[#4a86c8]">
                      {['Level', 'Pos.', 'Size (# Strands)', 'Strength Rating', 'Preform Color', 'Measured Tension (lbf)', 'Notes', ''].map((h, i) => (
                        <th key={i} className={clsx('text-left text-xs font-bold text-white px-4 py-2.5', i === 7 && 'w-24')}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nav-gray/40 bg-white">
                    {[
                      { level: '1', pos: 'R', size: '7/8" (1-19)', rating: 'EHS', color: 'Green', tension: '8160', notes: '' },
                      { level: '1', pos: 'L', size: '7/8" (1-19)', rating: 'EHS', color: 'Green', tension: '8460', notes: '' },
                      { level: '2', pos: 'R', size: '7/8" (1-19)', rating: 'EHS', color: 'Green', tension: '9240', notes: 'Exceeds limit' },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-hover-gray-lm/50 transition-colors">
                        <td className="px-4 py-2.5 text-sm text-black font-medium">{row.level}</td>
                        <td className="px-4 py-2.5 text-sm text-black">{row.pos}</td>
                        <td className="px-4 py-2.5 text-sm text-black">{row.size}</td>
                        <td className="px-4 py-2.5 text-sm text-black">{row.rating}</td>
                        <td className="px-4 py-2.5 text-sm text-black">{row.color}</td>
                        <td className="px-4 py-2.5 text-sm text-black font-mono">{row.tension}</td>
                        <td className="px-4 py-2.5 text-sm text-std-gray-lm italic">{row.notes || '—'}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1 justify-end">
                            <button className="p-1.5 rounded border border-nav-gray text-std-gray-lm hover:text-red-600 hover:bg-red-600/8 hover:border-red-600/30 transition-colors"><Flag size={11} /></button>
                            <button className="p-1.5 rounded border border-indigo-300/60 bg-indigo-500/8 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-colors"><Check size={11} /></button>
                            <button className="p-1.5 rounded border border-nav-gray text-std-gray-lm hover:text-red-600 hover:bg-red-600/8 hover:border-red-600/30 transition-colors"><Minus size={11} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-2.5 border-t border-nav-gray/40 flex justify-end bg-white">
                <button className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 hover:text-indigo-600 transition-colors">
                  <Plus size={12} /> Add Row
                </button>
              </div>
            </div>
          </Section>

          <div className="h-8" />
        </div>
      </div>
    </div>
  )
}
