import Panel from "./panel";
import AnswerPanel from "./answerPanel"
import Timer from "@/components/timer"
import Markdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeMathjax from "rehype-mathjax"

export default function AnswerCard({ children, currentQuestion, submitAnswer, timeLeft }) {
	return (
		<Panel title={`Question ${currentQuestion.id + 1}`} customStatus={<Timer timeLeft={timeLeft} />}>
			<h3 className="text-lg p-4">
				<Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeMathjax]}>
					{currentQuestion.text}
				</Markdown>
			</h3>
			<AnswerPanel submitAnswer={timeLeft > 0 ? submitAnswer : undefined} />
			{children}
		</Panel>
	)
}
