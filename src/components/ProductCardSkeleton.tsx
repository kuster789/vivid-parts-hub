const ProductCardSkeleton = () => (
  <div className="card-industrial flex flex-col overflow-hidden animate-pulse">
    <div className="h-48 bg-secondary" />
    <div className="flex flex-1 flex-col p-4">
      <div className="mb-2 h-3 w-24 rounded bg-muted" />
      <div className="mb-2 h-4 w-full rounded bg-muted" />
      <div className="mb-3 h-3 w-3/4 rounded bg-muted" />
      <div className="mt-auto flex items-center justify-between">
        <div className="h-6 w-20 rounded bg-muted" />
        <div className="h-9 w-9 rounded-md bg-muted" />
      </div>
    </div>
  </div>
);

export default ProductCardSkeleton;
