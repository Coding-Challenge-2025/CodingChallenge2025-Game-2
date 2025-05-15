import Panel from "./panel";
import AnswerPanel from "./answerPanel"
import Timer from "@/components/timer"
import Markdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeMathjax from "rehype-mathjax"
import clsx from "clsx"

export default function AnswerCard({ children, currentQuestion, submitAnswer, timeLeft }) {
	return (
		<Panel title={`Question ${currentQuestion.id + 1}`} customStatus={<Timer timeLeft={timeLeft} />}>
			<h3 className="text-lg p-4">
				<Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeMathjax]}>
					{currentQuestion.text}
				</Markdown>
			</h3>
			<AnswerPanel submitAnswer={timeLeft > 0 ? submitAnswer : undefined} />
			{currentQuestion.answer &&
				<h3 className={clsx("text-lg font-bold p-4",
					currentQuestion.correct && "text-green-500",
					!currentQuestion.correct && "text-red-500")}>
					Answer: <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeMathjax]}>
						{currentQuestion.answer}
					</Markdown>
				</h3>
			}
			{children}
		</Panel>
	)
}
