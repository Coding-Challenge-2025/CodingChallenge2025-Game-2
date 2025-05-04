export default function PuzzleBoard({ revealed, imageData }) {
  return (
    <div className="relative mx-auto aspect-[16/9] w-full max-w-4xl overflow-hidden bg-red-400">
      <img alt="Round 1 image" className="absolute inset-0 h-full w-full object-cover" src={imageData} />

      {!revealed[0] && <div className="absolute top-0 left-0 flex h-1/2 w-1/2 items-center justify-center border border-blue-500 bg-blue-400 piece-1">
        <span className="pb-20 text-xl font-bold text-white">1</span>
      </div>}

      {!revealed[1] && <div className="absolute top-0 right-0 flex h-1/2 w-1/2 items-center justify-center border border-blue-500 bg-blue-400 piece-2">
        <span className="pb-20 text-xl font-bold text-white">2</span>
      </div>}

      {!revealed[2] && <div className="absolute right-0 bottom-0 flex h-1/2 w-1/2 items-center justify-center border border-blue-500 bg-blue-400 piece-3">
        <span className="pt-20 text-xl font-bold text-white">3</span>
      </div>}

      {!revealed[3] && <div className="absolute bottom-0 left-0 flex h-1/2 w-1/2 items-center justify-center border border-blue-500 bg-blue-400 piece-4">
        <span className="pt-20 text-xl font-bold text-white">4</span>
      </div>}

      {!revealed[4] && <div className="absolute top-1/4 left-1/4 flex h-1/2 w-1/2 items-center justify-center border border-blue-500 bg-blue-400">
        <span className="text-xl font-bold text-white">5</span>
      </div>}
    </div>
  );
}
