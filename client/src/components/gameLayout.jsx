import Panel from "./game/panel"
import PuzzleBoard from "./puzzle-board"

export default function GameLayout({ children, revealed, imageData, notifications }) {
  return (
    <div className="min-h-screen p-2">
      <div className="max-w-full mx-auto">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-start">
          {/* Left column - Puzzle */}
          <div className="space-y-2">
            <Panel title="Puzzle Board">
              <PuzzleBoard revealed={revealed} imageData={imageData} />
            </Panel>
            {notifications?.length > 0 &&
              <Panel title="Notifications">
                {notifications.forEach((value, id) => {
                  <div key={value}>{value.time.toLocaleString()} - {value.message}</div>
                })}
              </Panel>
            }
          </div>

          {/* Right column - Questions and answers */}
          <div className="space-y-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
