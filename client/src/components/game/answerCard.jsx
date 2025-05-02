import Panel from "./panel";

export default function AnswerCard({ currentQuestion, submitAnswer }) {
	return (
		<Panel title={`Question ${currentQuestion.id}`}>
			<h3 className="text-lg font-bold mb-3">{currentQuestion.text}</h3>

			<AnswerPanel submitAnswer={submitAnswer} />
		</Panel>
	)
}
