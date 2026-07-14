'use client'

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-slate-50 px-6 py-20 text-slate-700">
          <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">VM Cart</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">Something went wrong</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              The storefront hit an unexpected error. Please refresh the page or try again in a moment.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  if (typeof reset === 'function') reset()
                  else window.location.reload()
                }}
                className="rounded-full bg-slate-800 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-900"
              >
                Try again
              </button>
              <a
                href="/"
                className="rounded-full border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Go home
              </a>
            </div>
            {process.env.NODE_ENV !== 'production' && error?.message ? (
              <pre className="mt-6 overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-200">
                {error.message}
              </pre>
            ) : null}
          </div>
        </div>
      </body>
    </html>
  )
}
