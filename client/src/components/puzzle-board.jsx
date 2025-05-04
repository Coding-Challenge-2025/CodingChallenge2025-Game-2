import clsx from 'clsx';

export default function PuzzleBoard({ revealed, imageData }) {
  return (
    <div className="relative mx-auto aspect-[16/9] w-full max-w-4xl overflow-hidden bg-red-400 grid grid-cols-4 grid-rows-3">
      <img alt="Round image" className="absolute inset-0 h-full w-full object-cover" src={imageData} />

      {revealed.map((value, index) =>
        <div className={clsx(
          "z-10 flex items-center justify-center border border-blue-500 bg-blue-400",
          value && "opacity-0")}
        >
          <span className="text-xl font-bold text-white">{index + 1}</span>
        </div>)}
    </div>
  );
}
