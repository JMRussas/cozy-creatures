// Cozy Creatures - App Root Component
//
// Top-level React component. Will hold the R3F canvas and UI layers.
//
// Depends on: nothing (for now)
// Used by:    main.tsx

export default function App() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-purple-300">Cozy Creatures</h1>
        <p className="mt-4 text-lg text-gray-400">
          Stage 0 complete — foundation is running.
        </p>
      </div>
    </div>
  );
}
