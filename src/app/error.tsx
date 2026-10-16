"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="narrow">
      <h1>Something went wrong</h1>
      <p>
        Your changes may not have completed. Retry or return to your workspace.
      </p>
      <button onClick={reset}>Try again</button>
    </main>
  );
}
