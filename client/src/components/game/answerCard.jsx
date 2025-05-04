import Panel from "./panel";
import AnswerPanel from "./answerPanel"
import Timer from "@/components/timer"

export default function AnswerCard({ currentQuestion, submitAnswer }) {
	return (
		<Panel title={`Question ${currentQuestion.id + 1}`} customStatus={<Timer timeLeft={3} />}>
			<h3 className="text-lg font-bold p-4">{currentQuestion.text}</h3>
			<AnswerPanel submitAnswer={submitAnswer} />
		</Panel>
	)
}
