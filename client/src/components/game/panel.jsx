export default function Panel({ title, children }) {
	return (
		<Card>
			<CardHeader className="py-2">
				<CardTitle className="text-lg text-blue-900">
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent className="p-3">
				<div className="bg-white p-3 rounded-lg shadow-sm mb-3">
					{children}
				</div>
			</CardContent>
		</Card>
	)
}
