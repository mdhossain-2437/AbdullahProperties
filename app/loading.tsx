export default function Loading() {
  return (
    <main className="state-page" aria-busy="true">
      <p className="sr-only" role="status">Loading page content.</p>
      <div className="loading-grid" aria-hidden="true">
        <div className="loading-card" />
        <div className="loading-card" />
        <div className="loading-card" />
      </div>
    </main>
  );
}
