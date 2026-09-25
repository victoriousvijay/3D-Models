import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-lab-bg px-6 text-center">
      <div>
        <p className="text-xs tracking-[0.2em] text-lab-muted uppercase">Simulation Lab</p>
        <h1 className="mt-3 text-2xl font-semibold text-lab-strong">This lab does not exist</h1>
        <p className="mt-2 text-sm text-lab-text">The address may be mistyped, or the lab may have moved.</p>
        <Link
          to="/lab"
          className="mt-6 inline-block rounded-full bg-lab-accent px-5 py-2 text-sm font-medium text-white"
        >
          Go to the Lab Hub
        </Link>
      </div>
    </main>
  )
}
