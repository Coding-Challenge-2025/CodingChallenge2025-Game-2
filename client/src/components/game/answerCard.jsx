import Panel from "./panel";
import AnswerPanel from "./answerPanel"
import Timer from "@/components/timer"

export default function AnswerCard({ children, currentQuestion, submitAnswer, timeLeft }) {
	return (
		<Panel title={`Question ${currentQuestion.id + 1}`} customStatus={<Timer timeLeft={timeLeft} />}>
			<h3 className="text-lg p-4">{currentQuestion.text}</h3>
			<AnswerPanel submitAnswer={timeLeft > 0 ? submitAnswer : undefined} />
			{children}
		</Panel>
	)
}
