import { Clock } from "lucide-react";

export default function Timer({ timeLeft }) {
  return (
    <div className="flex items-center bg-white px-3 py-1 rounded-full shadow">
      <Clock className="mr-1 h-4 w-4 text-blue-600" />
      <span className="font-bold text-lg">{timeLeft}s</span>
    </div>
  );
}
