export default function AnnoncesLoading() {
  return (
    <main className="pb-24 pt-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto h-3 w-40 animate-pulse rounded-full bg-stone-200" />
          <div className="mx-auto mt-4 h-8 w-64 animate-pulse rounded-full bg-stone-200" />
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
