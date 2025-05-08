import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react";
import { Send, Ellipsis } from "lucide-react";

export default function AnswerPanel({ submitAnswer, checkValidInput }) {
	const [answer, setAnswer] = useState("");
	const [answered, setAnswered] = useState(false);

	const onSubmit = (e) => {
		if (answer.length > 0 && !answered && submitAnswer && (!checkValidInput || checkValidInput(answer))) {
			console.log("submission:", answer);
			setAnswered(true);
			submitAnswer(answer);
		}
	};

	return <>
		{submitAnswer &&
			<Label className="ml-2">Input length: <strong>{answer.length}</strong></Label>
		}
		<div className="flex gap-2">
			<Input
				placeholder="Type your answer..."
				value={answer}
				onChange={(e) => setAnswer(e.target.value)}
				onKeyDown={(e) => e.key === "Enter" && onSubmit()}
				disabled={answered || !submitAnswer}
			/>
			<Button onClick={onSubmit} disabled={answered || !submitAnswer} className="bg-blue-600 hover:bg-blue-700">
				{!answered && <Send className="h-4 w-4" />}
				{answered && <Ellipsis className="h-4 w-4" />}
			</Button>
		</div>
	</>;
}
