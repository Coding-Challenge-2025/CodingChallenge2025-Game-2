"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import PuzzleBoard from "@/components/puzzle-board"
import RankingBoard from "@/components/ranking-board"
import { Clock } from "lucide-react"

export default function AudienceGame() {
  const [currentRound, setCurrentRound] = useState(1)
  const [timeLeft, setTimeLeft] = useState(15)
  const [gamePhase, setGamePhase] = useState("question") // question, results, roundSummary, final
  const [revealedPieces, setRevealedPieces] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [allPlayerResults, setAllPlayerResults] = useState([])
  const [players, setPlayers] = useState([
    { id: 1, name: "Player1", score: 400, roundScores: [200, 100, 100] },
    { id: 2, name: "Player2", score: 300, roundScores: [100, 100, 100] },
    { id: 3, name: "Player3", score: 200, roundScores: [50, 100, 50] },
    { id: 4, name: "Player4", score: 100, roundScores: [0, 50, 50] },
  ])

  // Sample rounds data
  const rounds = [
    {
      id: 1,
      keyPhrase: "AI TECHNOLOGY",
      questions: [
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
      ],
    },
    {
      id: 2,
      keyPhrase: "MACHINE LEARNING",
      questions: [
        { id: 1, text: "What is the largest ocean on Earth?", answer: "Pacific", keyword: "Machine" },
        { id: 2, text: "Which element has the symbol 'Fe'?", answer: "Iron", keyword: "Learning" },
        { id: 3, text: "Who wrote 'Hamlet'?", answer: "William Shakespeare", keyword: "Neural" },
        { id: 4, text: "What is the capital of Japan?", answer: "Tokyo", keyword: "Networks" },
        { id: 5, text: "Which planet is closest to the sun?", answer: "Mercury", keyword: "Data" },
        { id: 6, text: "What is the chemical symbol for silver?", answer: "Ag", keyword: "Science" },
        { id: 7, text: "Who painted 'Starry Night'?", answer: "Vincent van Gogh", keyword: "Algorithm" },
        { id: 8, text: "What is the hardest natural substance?", answer: "Diamond", keyword: "Model" },
        { id: 9, text: "Which country is known for the Great Barrier Reef?", answer: "Australia", keyword: "Deep" },
        { id: 10, text: "What is the smallest bone in the human body?", answer: "Stapes", keyword: "Computing" },
        {
          id: 11,
          text: "Which gas do plants absorb from the atmosphere?",
          answer: "Carbon Dioxide",
          keyword: "Artificial",
        },
        { id: 12, text: "What is the capital of Canada?", answer: "Ottawa", keyword: "Intelligence" },
      ],
    },
    {
      id: 3,
      keyPhrase: "DEEP LEARNING",
      questions: [
        { id: 1, text: "What is the currency of Japan?", answer: "Yen", keyword: "Deep" },
        { id: 2, text: "Which planet has the most moons?", answer: "Saturn", keyword: "Learning" },
        { id: 3, text: "Who discovered penicillin?", answer: "Alexander Fleming", keyword: "Neural" },
        { id: 4, text: "What is the capital of Australia?", answer: "Canberra", keyword: "Networks" },
        { id: 5, text: "Which element has the symbol 'Na'?", answer: "Sodium", keyword: "Data" },
        { id: 6, text: "What is the tallest animal?", answer: "Giraffe", keyword: "Science" },
        { id: 7, text: "Who wrote '1984'?", answer: "George Orwell", keyword: "Algorithm" },
        { id: 8, text: "What is the largest desert in the world?", answer: "Antarctica", keyword: "Model" },
        { id: 9, text: "Which country is known as the Land of Fire and Ice?", answer: "Iceland", keyword: "Machine" },
        { id: 10, text: "What is the fastest land animal?", answer: "Cheetah", keyword: "Computing" },
        {
          id: 11,
          text: "Which gas makes up the majority of Earth's atmosphere?",
          answer: "Nitrogen",
          keyword: "Artificial",
        },
        { id: 12, text: "What is the capital of Brazil?", answer: "Brasília", keyword: "Intelligence" },
      ],
    },
  ]

  // Initialize first question
  useEffect(() => {
    // Simulate host selecting a question
    const randomQuestion =
      rounds[currentRound - 1].questions[Math.floor(Math.random() * rounds[currentRound - 1].questions.length)]
    setCurrentQuestion(randomQuestion)
  }, [])

  // Timer effect
  useEffect(() => {
    if (gamePhase === "question" && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)

      return () => clearTimeout(timer)
    } else if (gamePhase === "question" && timeLeft === 0) {
      setGamePhase("results")

      // Simulate players getting answers
      const playerResults = players.map((player) => {
        const isCorrect = Math.random() > 0.3
        return {
          id: player.id,
          name: player.name,
          answer: isCorrect ? currentQuestion.answer : "Wrong answer",
          correct: isCorrect,
        }
      })

      setAllPlayerResults(playerResults)

      // Simulate players getting answers right
      if (Math.random() > 0.3) {
        setRevealedPieces([...revealedPieces, currentQuestion.id])
      }

      // Update player scores
      const updatedPlayers = players.map((player) => {
        const playerResult = playerResults.find((p) => p.id === player.id)
        const willGetCorrect = playerResult?.correct || false
        const roundIndex = currentRound - 1

        // Update round scores
        const roundScores = [...player.roundScores]
        if (willGetCorrect) {
          roundScores[roundIndex] = (roundScores[roundIndex] || 0) + 100
        }

        return {
          ...player,
          roundScores,
          score: willGetCorrect ? player.score + 100 : player.score,
        }
      })
      setPlayers(updatedPlayers)

      // Move to next question or round summary after a delay
      setTimeout(() => {
        // Check if all questions are answered (simplified for demo)
        if (revealedPieces.length >= 5 || Math.random() > 0.8) {
          setGamePhase("roundSummary")
        } else {
          // Simulate host selecting next question
          const nextQuestion =
            rounds[currentRound - 1].questions.find(
              (q) => !revealedPieces.includes(q.id) && q.id !== currentQuestion.id,
            ) || rounds[currentRound - 1].questions[0]

          setCurrentQuestion(nextQuestion)
          setTimeLeft(15)
          setGamePhase("question")
          setAllPlayerResults([])
        }
      }, 5000)
    }
  }, [timeLeft, gamePhase, currentQuestion])

  // Handle round transitions
  useEffect(() => {
    if (gamePhase === "roundSummary") {
      // After showing round summary, move to next round or final
      const roundTimer = setTimeout(() => {
        if (currentRound < rounds.length) {
          setCurrentRound(currentRound + 1)
          setRevealedPieces([])

          // Simulate host selecting first question of next round
          const firstQuestion = rounds[currentRound].questions[0]
          setCurrentQuestion(firstQuestion)
          setTimeLeft(15)
          setGamePhase("question")
          setAllPlayerResults([])
        } else {
          setGamePhase("final")
        }
      }, 5000)

      return () => clearTimeout(roundTimer)
    }
  }, [gamePhase, currentRound])

  const currentRoundData = rounds[currentRound - 1]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-2">
      <div className="max-w-full mx-auto">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl font-bold text-blue-900">
            {gamePhase === "final" ? "Game Complete" : `Round ${currentRound} of ${rounds.length}`}
          </h1>
          {gamePhase === "question" && (
            <div className="flex items-center bg-white px-3 py-1 rounded-full shadow">
              <Clock className="mr-1 h-4 w-4 text-blue-600" />
              <span className="font-bold text-lg">{timeLeft}s</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {/* Left column - Puzzle */}
          <div>
            <Card className="h-full">
              <CardHeader className="py-2">
                <CardTitle className="text-lg text-blue-900">Puzzle Board</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <PuzzleBoard
                  questions={currentRoundData.questions}
                  revealedPieces={revealedPieces}
                  currentRound={currentRound}
                  audienceView={true}
                />
                <div>The key phrase has <b>{currentRoundData.keyPhrase.length}</b> characters.</div>
                {(gamePhase === "roundSummary" || gamePhase === "final") && (
                  <div className="mt-2 p-2 bg-white rounded-lg border text-center">
                    <p className="text-lg font-bold text-blue-600">{currentRoundData.keyPhrase}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column - Question and rankings */}
          <div>
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-lg text-blue-900">
                  {gamePhase === "question"
                    ? "Current Question"
                    : gamePhase === "results"
                      ? "Question Results"
                      : gamePhase === "roundSummary"
                        ? `Round ${currentRound} Summary`
                        : "Game Complete"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                {gamePhase === "question" && currentQuestion && (
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <Badge className="bg-blue-100 text-blue-800 mb-2">Question {currentQuestion.id}</Badge>
                    <h3 className="text-lg font-bold mb-2">{currentQuestion.text}</h3>
                    <p className="text-gray-500 text-sm">Players are answering...</p>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {players.map((player) => (
                        <div key={player.id} className="bg-blue-50 p-2 rounded-md">
                          <div className="flex justify-between">
                            <span className="text-sm">{player.name}</span>
                            <span className="font-bold text-sm">{player.score}</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden mt-1">
                            <div
                              className="bg-blue-400 h-full animate-pulse"
                              style={{ width: `${Math.random() * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {gamePhase === "results" && currentQuestion && (
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <Badge className="bg-blue-100 text-blue-800 mb-2">Question {currentQuestion.id}</Badge>
                    <h3 className="text-lg font-bold mb-1">{currentQuestion.text}</h3>
                    <p className="text-md text-blue-600 font-bold mb-1">Answer: {currentQuestion.answer}</p>
                    <p className="text-sm text-blue-800 font-medium mb-2">Keyword: {currentQuestion.keyword}</p>

                    <div className="space-y-1 mt-2">
                      <p className="font-medium text-sm">Player Results:</p>
                      {allPlayerResults.map((player) => (
                        <div
                          key={player.id}
                          className={`p-2 rounded-md text-sm ${player.correct ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                            }`}
                        >
                          <div className="flex justify-between">
                            <span className="font-medium">{player.name}</span>
                            <span className={player.correct ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                              {player.correct ? "Correct" : "Incorrect"}
                            </span>
                          </div>
                          <p className="text-xs mt-1">Answer: {player.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {gamePhase === "roundSummary" && (
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <h3 className="text-xl font-bold mb-1 text-center">Round {currentRound} Complete!</h3>
                    <p className="text-center mb-2">The key phrase was:</p>
                    <p className="text-xl font-bold text-center text-blue-600 mb-3">{currentRoundData.keyPhrase}</p>

                    <div className="mb-3">
                      <h4 className="font-medium mb-2">Round {currentRound} Leaderboard</h4>
                      <RankingBoard
                        players={players
                          .map((p) => ({
                            ...p,
                            score: p.roundScores[currentRound - 1] || 0,
                          }))
                          .sort((a, b) => b.score - a.score)}
                      />
                    </div>

                    <div className="text-center text-sm text-gray-500">
                      {currentRound < rounds.length ? "Next round starting soon..." : "Calculating final results..."}
                    </div>
                  </div>
                )}

                {gamePhase === "final" && (
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <h3 className="text-xl font-bold mb-2 text-center">Game Over!</h3>
                    <p className="text-center mb-2">Final key phrase:</p>
                    <p className="text-xl font-bold text-center text-blue-600 mb-3">{currentRoundData.keyPhrase}</p>

                    <div className="mb-3">
                      <h4 className="font-medium mb-2">Final Leaderboard</h4>
                      <RankingBoard players={players.sort((a, b) => b.score - a.score)} />
                    </div>

                    <div className="mt-3">
                      <h4 className="font-medium mb-2">Round Scores</h4>
                      <div className="bg-white p-2 rounded-lg border">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-1">Player</th>
                              {rounds.map((round) => (
                                <th key={round.id} className="text-center p-1">
                                  Round {round.id}
                                </th>
                              ))}
                              <th className="text-center p-1">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {players
                              .sort((a, b) => b.score - a.score)
                              .map((player) => (
                                <tr key={player.id} className="border-b">
                                  <td className="p-1 font-medium">{player.name}</td>
                                  {player.roundScores.map((score, index) => (
                                    <td key={index} className="text-center p-1">
                                      {score || 0}
                                    </td>
                                  ))}
                                  <td className="text-center p-1 font-bold">{player.score}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="text-center text-gray-500 text-sm mt-3">Thank you for watching!</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
