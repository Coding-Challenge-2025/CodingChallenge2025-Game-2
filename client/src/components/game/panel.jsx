import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Panel({ title, customStatus, children }) {
	return (
		<Card className="bg-indigo-100 p-2">
			<CardHeader className="py-2">
				<div className="flex justify-between items-center mb-2">
					<CardTitle className="text-lg text-blue-900">
						{title}
					</CardTitle>
					{customStatus}
				</div>
			</CardHeader>
			<CardContent className="p-3">
				<div className="bg-white rounded-lg shadow-sm">
					{children}
				</div>
			</CardContent>
		</Card>
	)
}
