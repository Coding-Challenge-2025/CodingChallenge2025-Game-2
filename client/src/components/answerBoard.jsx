import clsx from "clsx";

export default function AnswerBoard({ answers }) {
  return (
    <div className="w-full">
      <div className="space-y-1">
        {answers.map((obj, index) => (
          <div
            key={obj.name}
            className={clsx("flex items-center p-2 rounded-lg bg-white border border-gray-100",
              obj.correct === false && "bg-red-300",
              obj.correct && "bg-green-300")}
          >
            {/*<div
              className="w-6 h-6 rounded-full flex items-center justify-center mr-2 bg-gray-200"
            >
              <span className="text-white font-bold text-xs">{index + 1}</span>
            </div>*/}
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
