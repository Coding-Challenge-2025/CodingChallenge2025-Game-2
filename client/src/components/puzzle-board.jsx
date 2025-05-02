export default function PuzzleBoard({ revealed, imageData }) {
  return (
    <div class="relative mx-auto aspect-[16/9] w-full max-w-4xl overflow-hidden bg-gray-100">
      <img alt="Round 1 image" class="absolute inset-0 h-full w-full object-cover" src={imageData} style="background-color: red" />

      {revealed[0] && <div class="absolute top-0 left-0 flex h-1/2 w-1/2 items-center justify-center border border-blue-500 bg-blue-400" style="clip-path: polygon(0 0, 100% 0, 100% 52%, 52% 52%, 52% 100%, 0 100%)">
        <span class="pb-20 text-xl font-bold text-white">1</span>
      </div>}

      {revealed[1] && <div class="absolute top-0 right-0 flex h-1/2 w-1/2 items-center justify-center border border-blue-500 bg-blue-400" style="clip-path: polygon(0 0, 100% 0, 100% 100%, 48% 100%, 48% 52%, 0 52%)">
        <span class="pb-20 text-xl font-bold text-white">2</span>
      </div>}

      {revealed[2] && <div class="absolute right-0 bottom-0 flex h-1/2 w-1/2 items-center justify-center border border-blue-500 bg-blue-400" style="clip-path: polygon(48% 0, 100% 0, 100% 100%, 0 100%, 0 48%, 48% 48%)">
        <span class="pt-20 text-xl font-bold text-white">3</span>
      </div>}

      {revealed[3] && <div class="absolute bottom-0 left-0 flex h-1/2 w-1/2 items-center justify-center border border-blue-500 bg-blue-400" style="clip-path: polygon(0 0, 52% 0, 52% 48%, 100% 48%, 100% 100%, 0 100%)">
        <span class="pt-20 text-xl font-bold text-white">4</span>
      </div>}

      {revealed[4] && <div class="absolute top-1/4 left-1/4 flex h-1/2 w-1/2 items-center justify-center border border-blue-500 bg-blue-400">
        <span class="text-xl font-bold text-white">5</span>
      </div>}
    </div>
  );
}
