import clsx from "clsx";

export default function AnswerBoard({ answers }) {
  return (
    <div className="w-full">
      <div className="space-y-1">
        {answers.map((obj, index) => (
          <div
            key={obj.name}
            className={clsx("flex items-center p-2 rounded-lg",
              obj.correct === false && "bg-red-300",
              obj.correct && "bg-green-300",
              obj.correct === undefined && "bg-white")}
          >
            {<div
              className="p-1 rounded-full flex text-center mt-1 mr-2 bg-sky-600"
            >
              <span className="text-white font-bold text-xs w-12">{(obj.epoch / 1000).toFixed(2)}s</span>
            </div>}
            <div className="flex-1">
              <span className="font-medium text-sm">{obj.name}</span>
            </div>
            <div className="font-bold text-md">{obj.answer || "No Answer"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
