import { ArrowRight } from 'lucide-react'
import type { Ref } from 'react'

/**
 * The landing page's primary action. A slowly rotating light ring and a
 * soft blue glow suggest a doorway; hover lifts it, press settles it. All
 * motion is disabled under `prefers-reduced-motion`.
 */
export function EnterLabButton({
  onEnter,
  disabled = false,
  ref,
}: {
  onEnter: () => void
  disabled?: boolean
  ref?: Ref<HTMLButtonElement>
}) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onEnter}
      disabled={disabled}
      className="group relative isolate inline-flex items-center gap-3 rounded-full px-8 py-4 text-sm font-semibold tracking-[0.18em] text-white uppercase transition-transform duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-80 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {/* Rotating light ring (the "portal" edge). */}
      <span aria-hidden className="absolute -inset-[2px] -z-20 overflow-hidden rounded-full">
        <span className="absolute inset-[-150%] animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,#7aa9f5_60deg,#ffffff_90deg,#1d6fe0_140deg,transparent_200deg)] motion-reduce:animate-none" />
      </span>
      {/* Body and glow. */}
      <span
        aria-hidden
        className="absolute inset-0 -z-10 rounded-full bg-gradient-to-b from-[#2b7cf0] to-[#1457c4] shadow-[0_12px_40px_-10px_rgba(29,111,224,0.75),inset_0_1px_0_rgba(255,255,255,0.35)] transition-shadow duration-300 group-hover:shadow-[0_18px_56px_-8px_rgba(29,111,224,0.9),inset_0_1px_0_rgba(255,255,255,0.45)]"
      />
      <span>Enter 3D Simulation Lab</span>
      <ArrowRight
        aria-hidden
        className="size-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
      />
    </button>
  )
}
