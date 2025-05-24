import clsx from "clsx";

export default function KeywordBoard({ keywords }) {
  return (
    <div className="w-full">
      <div className="space-y-1">
        {keywords.map((obj, index) => (
          <div
            key={obj.name}
            className={clsx("flex items-center p-2 rounded-lg",
              obj.correct === false && "bg-red-300",
              obj.correct && "bg-green-300",
              obj.correct === undefined && "bg-white")}
          >
            <div className="flex-1">
              <span className="font-medium text-sm">{obj.name}</span>
            </div>
            <div className="font-bold text-md">{!obj.visible ? "???" : obj.keyword}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
