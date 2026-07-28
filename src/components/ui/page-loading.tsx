export function PageLoading() {
  return (
    <main id="main-content" aria-busy="true" className="fixed inset-0 z-50 grid min-h-[100dvh] place-items-center bg-white px-5">
      <div role="status" aria-live="polite" className="flex flex-col items-center text-center">
        <img src="/logo.svg" alt="" aria-hidden="true" className="h-14 w-auto" />
        <p className="mt-6 flex items-center gap-3 text-sm font-extrabold text-ink">
          <span aria-hidden="true" className="h-4 w-4 rounded-full border-2 border-line border-t-primary-dark motion-safe:animate-spin" />
          Memuat…
        </p>
      </div>
    </main>
  )
}
