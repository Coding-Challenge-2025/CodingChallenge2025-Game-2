import Panel from "./game/panel"
import PuzzleBoard from "./puzzle-board"
import clsx from "clsx"

export default function GameLayout({ children, revealed, imageData, notifications, isPlayer = true }) {
  return (
    <>
      <div className={clsx(
        "min-h-screen max-w-full mx-auto p-2 gap-2",
        !isPlayer && "items-center")}>
        <img src="/header2.png" className="mx-auto mb-4 w-2/3" />
        <div className={clsx("grid grid-cols-1 md:grid-cols-2",
          !isPlayer && "items-center")}>
          {/* Left column - Puzzle */}
          <div className="space-y-2">
            <Panel title="Puzzle Board">
              <PuzzleBoard revealed={revealed} imageData={imageData} />
            </Panel>
            {notifications?.length > 0 &&
              <Panel title="Notifications">
                {notifications.map((value, id) =>
                  <div key={value.time + value.message}>{value.time.toLocaleString()} - {value.message}</div>
                )}
              </Panel>
            }
          </div>

          {/* Right column - Questions and answers */}
          <div className="space-y-2">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}
