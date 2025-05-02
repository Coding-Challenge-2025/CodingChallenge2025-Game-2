export default function GameLayout({ revealedPieces, children }) {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-2">
      <div className="max-w-full mx-auto">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {/* Left column - Puzzle */}
          <Panel title="Puzzle Board">
            <PuzzleBoard
              questions={currentRoundData.questions}
              revealedPieces={revealedPieces}
              currentRound={currentRound}
            />
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
