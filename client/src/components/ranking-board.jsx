export default function RankingBoard({ players }) {
  return (
    <div className="w-full">
      <div className="space-y-1">
        {players.slice(0).sort((a, b) => (b.score ?? b.point) - (a.score ?? a.point)).map((player, index) => (
          <div
            key={player.name}
            className={`flex items-center p-2 rounded-lg ${index === 0
              ? "bg-yellow-50 border border-yellow-200"
              : index === 1
                ? "bg-gray-50 border border-gray-200"
                : index === 2
                  ? "bg-amber-50 border border-amber-200"
                  : "bg-white border border-gray-100"
              }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${index === 0
                ? "bg-yellow-400"
                : index === 1
                  ? "bg-gray-400"
                  : index === 2
                    ? "bg-amber-600"
                    : "bg-gray-200"
                }`}
            >
              <span className="text-white font-bold text-xs">{index + 1}</span>
            </div>
            <div className="flex-1">
              <span className="font-medium text-sm">{player.name}</span>
            </div>
            <div className="font-bold text-md">{player.score ?? '+' + player.point}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
