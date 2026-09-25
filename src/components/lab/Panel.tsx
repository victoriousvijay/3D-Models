import { cn } from 'cn'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState, type ReactNode } from 'react'

/**
 * Translucent instrument panel floating over the 3D lab. `bare` drops the
 * chrome so the same content can sit inside the mobile bottom sheet.
 * Titled floating panels can be collapsed to their header to free the scene;
 * pass `collapsible={false}` for panels that manage their own collapsing.
 */
export function Panel({
  title,
  actions,
  bare = false,
  collapsible = !bare && Boolean(title),
  className,
  children,
  ...rest
}: {
  title?: string
  actions?: ReactNode
  bare?: boolean
  collapsible?: boolean
  className?: string
  children: ReactNode
} & Omit<React.HTMLAttributes<HTMLElement>, 'title'>) {
  const [collapsed, setCollapsed] = useState(false)
  const toggle = collapsible ? (
    <button
      type="button"
      aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${title ?? 'panel'}`}
      aria-expanded={!collapsed}
      title={collapsed ? 'Expand' : 'Collapse'}
      onClick={() => {
        setCollapsed(!collapsed)
      }}
      className="rounded text-lab-muted hover:text-lab-strong"
    >
      {collapsed ? (
        <ChevronDown className="size-4" aria-hidden />
      ) : (
        <ChevronUp className="size-4" aria-hidden />
      )}
    </button>
  ) : null
  return (
    <section
      className={cn(
        'pointer-events-auto text-sm',
        !bare &&
          'rounded-lg border border-lab-line/70 bg-lab-bg/80 p-3 shadow-lg backdrop-blur-sm group-data-[tone=dark]/tone:bg-lab-bg/95',
        className,
      )}
      {...(title ? { 'aria-label': title } : {})}
      {...rest}
    >
      {title || actions || toggle ? (
        <header className={cn('flex items-center justify-between gap-2', !collapsed && 'mb-2')}>
          {title ? (
            <h2 className="text-[11px] font-medium tracking-[0.14em] text-lab-muted uppercase">{title}</h2>
          ) : null}
          <div className="flex items-center gap-2">
            {actions}
            {toggle}
          </div>
        </header>
      ) : null}
      {collapsed ? null : children}
    </section>
  )
}
