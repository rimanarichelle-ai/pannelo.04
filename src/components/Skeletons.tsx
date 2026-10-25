/**
 * Shimmer-based Skeleton for PANNELLO Product Cards.
 * Preserves the exact geometry, aspect ratios, and padding to prevent Cumulative Layout Shift (CLS).
 */
export function ProductCardSkeleton() {
  return (
    <article
      className="relative flex flex-col h-full w-full min-w-0 p-1.5 min-[380px]:p-2 sm:p-2.5 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-[16px] min-[380px]:rounded-[18px] sm:rounded-[20px] shadow-xs select-none"
      aria-hidden="true"
    >
      {/* Inset Rounded Food Image Placeholder */}
      <div className="relative w-full aspect-[1/0.94] sm:aspect-square rounded-[11px] min-[380px]:rounded-[13px] sm:rounded-[14px] shimmer-skeleton shrink-0" />

      {/* Card Body Skeleton */}
      <div className="px-0.5 min-[380px]:px-1 sm:px-1.5 pt-2 min-[380px]:pt-2.5 pb-0.5 flex-1 flex flex-col min-w-0">
        {/* Category Label */}
        <div className="h-2.5 w-16 max-w-full rounded shimmer-skeleton opacity-70" />

        {/* Product Name */}
        <div className="mt-2 h-4 w-4/5 rounded-md shimmer-skeleton" />

        {/* Description Lines */}
        <div className="mt-2 space-y-1.5">
          <div className="h-3 w-full rounded shimmer-skeleton opacity-65" />
          <div className="h-3 w-2/3 rounded shimmer-skeleton opacity-65" />
        </div>

        {/* Bottom Price + Squircle Add Button */}
        <div className="mt-auto pt-2.5 sm:pt-3 flex items-center justify-between gap-1.5">
          <div className="h-5 w-14 min-[380px]:w-16 rounded-md shimmer-skeleton" />
          <div className="w-8 h-8 min-[380px]:w-9 min-[380px]:h-9 sm:w-9.5 sm:h-9.5 rounded-[10px] min-[380px]:rounded-[11px] shimmer-skeleton shrink-0" />
        </div>
      </div>
    </article>
  );
}

/**
 * Shimmer-based Skeleton for an entire Menu Category Section (Red Cloud + Product Cards Grid).
 */
export function MenuSectionSkeleton({ cardCount = 4 }: { cardCount?: number }) {
  return (
    <section className="py-3 sm:py-4 select-none" aria-hidden="true">
      <div className="pannello-red-cloud">
        <div className="pannello-red-cloud-crest-tl" />
        <div className="pannello-red-cloud-crest-tr" />
        <div className="pannello-red-cloud-crest-br" />
        <div className="pannello-red-cloud-crest-bl" />

        <div className="pannello-red-cloud-body px-3 pt-4 pb-3.5 min-[380px]:px-4 min-[380px]:pt-5 min-[380px]:pb-4 sm:px-5 sm:pt-6 sm:pb-5 md:px-6 md:pt-7 md:pb-6 lg:px-8 lg:pt-8 lg:pb-8">
          <div className="px-0.5 sm:px-1 min-w-0">
            <div className="h-7 w-48 max-w-full rounded-md bg-white/15 dark:bg-zinc-900/10" />
            <div className="mt-2 h-4 w-72 max-w-full rounded bg-white/10 dark:bg-zinc-900/[0.07]" />
            <div className="mt-3 mb-3.5 min-[380px]:mt-3.5 min-[380px]:mb-4 sm:mt-4 sm:mb-5 h-px w-full bg-white/15 dark:bg-zinc-900/12" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 lg:gap-6 w-full min-w-0">
            {Array.from({ length: cardCount }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

