import Panel from "./panel";
import AnswerPanel from "./answerPanel"

export default function KeywordCard({ keywordLength, submitKeyword, questionsAnswered }) {
	return (
		<Panel title="Guess the keyword">
			<h3 className="p-4">Answer is <strong>{keywordLength}</strong> characters long. Try your luck!</h3>

			{questionsAnswered >= 6 &&
				<AnswerPanel submitAnswer={submitKeyword}
					checkValidInput={(input) => input.replace(/[\s-]/g, "").length === keywordLength} />
			}
			{questionsAnswered < 6 &&
				<h3 className="mt-4 p-4">Progress until solvable: <strong>{questionsAnswered}</strong>/6.</h3>
			}
		</Panel>
	)
}
