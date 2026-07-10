export default function PropertyLoading() {
  return (
    <main className="pb-24 pt-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="h-4 w-32 animate-pulse rounded bg-stone-200" />

        <div className="mt-6 aspect-[16/9] w-full animate-pulse rounded-2xl bg-stone-200" />

        <div className="mt-12 grid gap-12 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="h-6 w-24 animate-pulse rounded-full bg-stone-200" />
            <div className="h-9 w-3/4 animate-pulse rounded bg-stone-200" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-stone-200" />
            <div className="h-24 w-full animate-pulse rounded bg-stone-200" />
          </div>

          <div className="h-48 w-full animate-pulse rounded-2xl bg-stone-200" />
        </div>
      </div>
    </main>
  );
}
