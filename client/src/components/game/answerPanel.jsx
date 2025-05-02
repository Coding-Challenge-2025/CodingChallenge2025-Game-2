export default function AnswerPanel({ submitAnswer }) {
	const [answer, setAnswer] = useState("");
	const [answered, setAnswered] = useState(false);

	const onSubmit = (e) => {
		submitAnswer(answer);
		setAnswered(true);
	};

	return <>
		(
		<div className="flex gap-2">
			<Input
				placeholder="Type your answer..."
				value={answer}
				onChange={(e) => setAnswer(e.target.value)}
				onKeyDown={(e) => e.key === "Enter" && submitAnswer()}
				disabled={!disabled}
			/>
			<Button onClick={submitAnswer} className="bg-blue-600 hover:bg-blue-700">
				<Send className="h-4 w-4" />
			</Button>
		</div>)
	</>;
}
