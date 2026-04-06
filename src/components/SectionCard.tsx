import React from 'react'

export function SectionCard({
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

export function AttachmentRow({
  id, name, size, date, accentHover = 'hover:border-gray-300 hover:bg-bg-gray-lm'
}: {
  id: string
  name: string
  size: string
  date: string
  accentHover?: string
}) {
  return (
    <div
      key={id}
      className={`flex items-center justify-between p-3 rounded-lg border border-nav-gray ${accentHover} transition-colors group`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-bg-gray-lm flex items-center justify-center border border-nav-gray">
          <span className="text-xs font-bold text-std-gray-lm uppercase leading-none">
            {name.split('.').pop()?.slice(0, 3) ?? 'file'}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-black">{name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-std-gray-lm">{size}</span>
            <span className="text-std-gray-dm">·</span>
            <span className="text-xs text-std-gray-lm">{date}</span>
          </div>
        </div>
      </div>
      <button className="p-1.5 rounded-lg text-std-gray-lm hover:text-black hover:bg-hover-gray-lm transition-colors opacity-0 group-hover:opacity-100">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      </button>
    </div>
  )
}
