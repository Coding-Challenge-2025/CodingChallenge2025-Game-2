import Panel from "./game/panel"
import PuzzleBoard from "./puzzle-board"

export default function GameLayout({ children, revealed }) {
  return (
    <div className="min-h-screen p-2">
      <div className="max-w-full mx-auto">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-start">
          {/* Left column - Puzzle */}
          <Panel title="Puzzle Board">
            <PuzzleBoard revealed={revealed} imageData="" />
          </Panel>

          {/* Right column - Questions and answers */}
          <div className="space-y-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
