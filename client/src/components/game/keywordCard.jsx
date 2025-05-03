import Panel from "./panel";
import AnswerPanel from "./answerPanel"

export default function KeywordCard({ keywordLength, submitKeyword }) {
	return (
		<Panel title="Guess the keyword">
			<h3 className="p-4">Answer is <strong>{keywordLength}</strong> characters long. Try your luck!</h3>

			<AnswerPanel submitAnswer={submitKeyword} />
		</Panel>
	)
}
