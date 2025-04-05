import { useState, useEffect } from "react";

export default function PuzzleBoard({ questions, revealedPieces, currentRound, audienceView = false }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    // Create puzzle pieces from the questions
    const newPieces = questions.map((question) => ({
      id: question.id,
      revealed: revealedPieces.includes(question.id),
    }));

    setPieces(newPieces);
  }, [questions, revealedPieces]);

  // Create a 4x3 grid layout
  const gridLayout = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
  ];

  return (
    <div className="w-full">
      <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
        {/* Background image that will be revealed */}
        <div className="absolute inset-0">
          <img
            src={`/placeholder.jpg?round=${currentRound}`}
            alt={`Round ${currentRound} image`}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Puzzle grid */}
        <div className="absolute inset-0 grid grid-rows-3 gap-1 p-1">
          {gridLayout.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-4 gap-1">
              {row.map((pieceId) => {
                const piece = pieces.find((p) => p.id === pieceId);
                return (
                  <div
                    key={pieceId}
                    className={`relative flex items-center justify-center ${piece?.revealed ? "opacity-0" : "bg-blue-400"
                      } border border-blue-500 transition-opacity duration-300`}
                  >
                    {!piece?.revealed && <span className="text-white text-xl font-bold">{pieceId}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Keywords display */}
      <div className="mt-2 grid grid-cols-2 gap-1 text-sm">
        {pieces
          .filter((p) => p.revealed)
          .map((piece) => {
            const question = questions.find((q) => q.id === piece.id);
            return (
              <div key={piece.id} className="bg-blue-100 p-1 rounded border border-blue-300 text-center">
                <span className="font-medium text-blue-800">{question?.keyword}</span>
              </div>
            );
          })}
      </div>
    </div>
  );
}
