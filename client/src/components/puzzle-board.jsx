import clsx from 'clsx';
import { Badge } from "@/components/ui/badge"

import Markdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeMathjax from "rehype-mathjax"

export default function PuzzleBoard({ revealed, imageData }) {
  return (
    <div>
      <div className="relative mx-auto aspect-[16/9] w-full max-w-4xl overflow-hidden bg-red-400 grid grid-cols-4 grid-rows-3 bg-cover bg-center"
        style={{ backgroundImage: `url(${imageData})` }}
      >
        {revealed.map((value, index) =>
          <div key={index} className={clsx(
            "z-10 flex items-center justify-center border border-blue-500 bg-blue-400",
            value === "" && "grayscale",
            value && "opacity-0")}
          >
            <span className="text-xl font-bold text-white">{index + 1}</span>
          </div>)}
      </div>
      <div class="mt-1">
        {revealed.map((value, index) =>
          value && <Badge><Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeMathjax]}>
            {value}
          </Markdown></Badge>)}
      </div>
    </div>
  );
}
