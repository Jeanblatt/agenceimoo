export default function BiensLoading() {
  return (
    <main className="pb-24">
      <div className="min-h-[55vh] animate-pulse bg-stone-900" />

      <div className="mx-auto max-w-7xl px-6 pt-16 lg:px-8">
        <div className="h-4 w-32 animate-pulse rounded bg-stone-200" />

        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200"
            >
              <div className="aspect-[4/3] w-full animate-pulse bg-stone-200" />
              <div className="space-y-3 p-6">
                <div className="h-5 w-3/4 animate-pulse rounded bg-stone-200" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-stone-200" />
                <div className="h-4 w-full animate-pulse rounded bg-stone-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
