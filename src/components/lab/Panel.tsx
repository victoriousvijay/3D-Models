import { cn } from 'cn'
import type { ReactNode } from 'react'

/**
 * Translucent instrument panel floating over the 3D lab. `bare` drops the
 * chrome so the same content can sit inside the mobile bottom sheet.
 */
export function Panel({
  title,
  actions,
  bare = false,
  className,
  children,
  ...rest
}: {
  title?: string
  actions?: ReactNode
  bare?: boolean
  className?: string
  children: ReactNode
} & Omit<React.HTMLAttributes<HTMLElement>, 'title'>) {
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
      {title || actions ? (
        <header className="mb-2 flex items-center justify-between gap-2">
          {title ? (
            <h2 className="text-[11px] font-medium tracking-[0.14em] text-lab-muted uppercase">{title}</h2>
          ) : null}
          {actions}
        </header>
      ) : null}
      {children}
    </section>
  )
}
