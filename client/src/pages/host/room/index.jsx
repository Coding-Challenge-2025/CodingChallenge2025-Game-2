import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, Copy, ArrowRight } from "lucide-react"

export default function HostRoom() {
  const [roomId, setRoomId] = useState("")
  const [players, setPlayers] = useState([])
  const navigate = useNavigate()

  const questions = [
    { id: 1, text: "What is the capital of France?", answer: "Paris", keyword: "Artificial" },
    { id: 2, text: "Which planet is known as the Red Planet?", answer: "Mars", keyword: "Intelligence" },
    { id: 3, text: "What is the largest mammal?", answer: "Blue Whale", keyword: "Neural" },
    { id: 4, text: "Who painted the Mona Lisa?", answer: "Leonardo da Vinci", keyword: "Networks" },
    { id: 5, text: "What is the chemical symbol for gold?", answer: "Au", keyword: "Machine" },
    { id: 6, text: "What is the tallest mountain in the world?", answer: "Mount Everest", keyword: "Learning" },
    { id: 7, text: "Which element has the chemical symbol 'O'?", answer: "Oxygen", keyword: "Data" },
    { id: 8, text: "What is the largest planet in our solar system?", answer: "Jupiter", keyword: "Science" },
    { id: 9, text: "Who wrote 'Romeo and Juliet'?", answer: "William Shakespeare", keyword: "Algorithm" },
    { id: 10, text: "What is the smallest prime number?", answer: "2", keyword: "Model" },
    { id: 11, text: "Which country is known as the Land of the Rising Sun?", answer: "Japan", keyword: "Deep" },
    { id: 12, text: "What is the chemical formula for water?", answer: "H2O", keyword: "Computing" },
  ]

  const keyPhrase = "AI TECHNOLOGY"

  useEffect(() => {
    const generatedId = Math.random().toString(36).substring(2, 8).toUpperCase()
    setRoomId(generatedId)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (players.length < 5) {
        const newPlayer = {
          id: Math.random().toString(36).substring(2, 9),
          name: `Player${players.length + 1}`,
          score: 0,
        }
        setPlayers([...players, newPlayer])
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [players])

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId)
  }

  const startGame = () => {
    if (players.length < 1) {
      alert("Wait for at least one player to join")
      return
    }
    navigate("/host/game")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-900 mb-6">Host Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-blue-900">Room Code</CardTitle>
              <CardDescription>Share this code with players</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input value={roomId} readOnly className="text-xl font-bold text-center" />
                <Button variant="outline" size="icon" onClick={copyRoomId}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl text-blue-900 flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Players ({players.length})
              </CardTitle>
              <CardDescription>Waiting for players to join</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {players.length > 0 ? (
                  players.map((player) => (
                    <div key={player.id} className="bg-white rounded-md p-2 text-center">
                      {player.name}
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-2 text-gray-500">
                    No players have joined yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl text-blue-900">Game Information</CardTitle>
            <CardDescription>Review the questions and key phrase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label className="text-lg font-medium mb-2 block">Key Phrase</Label>
              <div className="bg-white p-3 rounded-md border">
                <p className="font-bold text-xl text-blue-900">{keyPhrase}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Players will try to guess this phrase as they reveal keywords.
                </p>
              </div>
            </div>

            <div>
              <Label className="text-lg font-medium mb-2 block">Questions</Label>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                {questions.map((question, index) => (
                  <div key={question.id} className="bg-white p-3 rounded-md border">
                    <div className="flex items-start">
                      <span className="font-bold mr-2 text-blue-900">{index + 1}.</span>
                      <div>
                        <p className="font-medium">{question.text}</p>
                        <div className="flex justify-between mt-1">
                          <p className="text-sm text-gray-500">
                            <span className="font-medium">Answer:</span> {question.answer}
                          </p>
                          <p className="text-sm text-blue-600 font-medium">
                            Keyword: {question.keyword}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={startGame} className="bg-blue-600 hover:bg-blue-700" size="lg">
            Start Game
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
