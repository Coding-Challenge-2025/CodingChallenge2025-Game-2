import Panel from "./panel";

export default function KeywordCard({ keywordLength, submitKeyword }) {
	return (
		<Panel title="Guess the keyword">
			<div>Answer is <strong>{keywordLength}</strong> characters long. Try your luck!</div>

			<AnswerPanel submitAnswer={submitKeyword} />
		</Panel>
	)
}
