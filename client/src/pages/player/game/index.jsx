"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import PuzzleBoard from "@/components/puzzle-board"
import RankingBoard from "@/components/ranking-board"
import { Clock, Send, AlertCircle } from "lucide-react"
import Timer from "@/components/timer"
import GameLayout from "../../../components/gameLayout"
import AnswerCard from "../../../components/game/answerCard"
import KeywordCard from "../../../components/game/keywordCard"

export default function PlayerGame() {
  const navigate = useNavigate()
  const [currentRound, setCurrentRound] = useState(1)
  const [timeLeft, setTimeLeft] = useState(15)
  const [gamePhase, setGamePhase] = useState("waiting") // waiting, question, answered, results, roundSummary, final, guessing
  const [answer, setAnswer] = useState("")
  const [keyPhrase, setKeyPhrase] = useState("")
  const [score, setScore] = useState(0)
  const [roundScores, setRoundScores] = useState([0, 0, 0])
  const [isCorrect, setIsCorrect] = useState(null)
  const [revealedPieces, setRevealedPieces] = useState([])
  const [waitingForHost, setWaitingForHost] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [allPlayerResults, setAllPlayerResults] = useState([])

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

  const players = [
    { id: 1, name: "You", score: score },
    { id: 2, name: "Player2", score: 300 },
    { id: 3, name: "Player3", score: 200 },
    { id: 4, name: "Player4", score: 100 },
  ]

  // Simulate game flow
  useEffect(() => {
    // Start first question after a delay
    const startTimer = setTimeout(() => {
      if (gamePhase === "waiting") {
        // Simulate host selecting a question
        const randomQuestion =
          rounds[currentRound - 1].questions[Math.floor(Math.random() * rounds[currentRound - 1].questions.length)]
        setCurrentQuestion(randomQuestion)
        setGamePhase("question")
      }
    }, 2000)

    return () => clearTimeout(startTimer)
  }, [])

  // Timer effect
  useEffect(() => {
    if (gamePhase === "question" && timeLeft > 0 && !waitingForHost) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)

      return () => clearTimeout(timer)
    } else if (gamePhase === "question" && timeLeft === 0 && !waitingForHost) {
      setGamePhase("answered")
      setWaitingForHost(true)

      // In a real app, this would notify the host that the player has run out of time
    }
  }, [timeLeft, gamePhase, waitingForHost])

  // Simulate host revealing the answer after a delay
  useEffect(() => {
    if (gamePhase === "answered" && waitingForHost) {
      // In a real app, this would be triggered by the host's action
      const hostTimer = setTimeout(() => {
        // Host reveals the answer
        const correct = answer.toLowerCase() === currentQuestion.answer.toLowerCase()

        setIsCorrect(correct)

        // Generate random results for other players
        const otherPlayerResults = [
          {
            id: 2,
            name: "Player2",
            answer: Math.random() > 0.5 ? currentQuestion.answer : "Wrong",
            correct: Math.random() > 0.5,
          },
          {
            id: 3,
            name: "Player3",
            answer: Math.random() > 0.5 ? currentQuestion.answer : "Wrong",
            correct: Math.random() > 0.5,
          },
          {
            id: 4,
            name: "Player4",
            answer: Math.random() > 0.5 ? currentQuestion.answer : "Wrong",
            correct: Math.random() > 0.5,
          },
        ]

        setAllPlayerResults([{ id: 1, name: "You", answer, correct }, ...otherPlayerResults])

        if (correct) {
          // Update score
          const newRoundScores = [...roundScores]
          newRoundScores[currentRound - 1] += 100
          setRoundScores(newRoundScores)
          setScore(score + 100)

          // Add the revealed piece
          setRevealedPieces([...revealedPieces, currentQuestion.id])
        }

        setWaitingForHost(false)

        // Move to results phase
        setGamePhase("results")

        // After showing results, move to next question or round summary
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
            setAnswer("")
            setIsCorrect(null)
            setAllPlayerResults([])
          }
        }, 5000)
      }, 3000)

      return () => clearTimeout(hostTimer)
    }
  }, [gamePhase, waitingForHost, currentQuestion, answer, score, revealedPieces])

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
          setAnswer("")
          setIsCorrect(null)
          setAllPlayerResults([])
        } else {
          setGamePhase("final")
        }
      }, 5000)

      return () => clearTimeout(roundTimer)
    }
  }, [gamePhase, currentRound])

  const submitAnswer = () => {
    if (!answer.trim()) return

    setGamePhase("answered")
    setWaitingForHost(true)

    // In a real app, this would notify the host that the player has submitted an answer
  }

  const submitKeyPhrase = () => {
    if (!keyPhrase.trim()) return

    setGamePhase("guessing")
    setWaitingForHost(true)

    // In a real app, this would notify the host that the player has guessed the key phrase

    // Simulate host verifying the key phrase after a delay
    setTimeout(() => {
      const isCorrectPhrase = keyPhrase.toLowerCase() === rounds[currentRound - 1].keyPhrase.toLowerCase()

      if (isCorrectPhrase) {
        // Player guessed correctly
        const newRoundScores = [...roundScores]
        newRoundScores[currentRound - 1] += 500
        setRoundScores(newRoundScores)
        setScore(score + 500)

        if (currentRound < rounds.length) {
          setGamePhase("roundSummary")
        } else {
          setGamePhase("final")
        }
      } else {
        // Player guessed incorrectly
        setWaitingForHost(false)
        setGamePhase("question")
        setKeyPhrase("")
      }
    }, 3000)
  }

  const currentRoundData = rounds[currentRound - 1]

  return (
    <GameLayout>
      <AnswerCard currentQuestion={{ id: 3, text: "What's ligma?" }} submitAnswer={submitAnswer} />
      <KeywordCard keywordLength={12} submitKeyword={submitKeyPhrase} />
    </GameLayout >
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-2">
      <div className="max-w-full mx-auto">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl font-bold text-blue-900">
            {gamePhase === "final" ? "Game Complete" : `Round ${currentRound} of ${rounds.length}`}
          </h1>
          {(gamePhase === "question" || gamePhase === "answered") && !waitingForHost && (
            <Timer timeLeft={timeLeft} />
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
                />
                <div>The key phrase has <b>{currentRoundData.keyPhrase.length}</b> characters.</div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Questions and answers */}
          <div className="space-y-2">
            {gamePhase === "waiting" && (
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-lg text-blue-900">Waiting for Host</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="flex justify-center py-4">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-200 mb-3"></div>
                      <div className="h-3 w-32 bg-blue-200 rounded mb-2"></div>
                      <div className="h-3 w-24 bg-blue-200 rounded"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {(gamePhase === "question" || gamePhase === "answered") && currentQuestion && (
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-lg text-blue-900">
                    <div className="flex justify-between items-center">
                      <span>Current Question</span>
                      <Badge className="bg-blue-100 text-blue-800">Question {currentQuestion.id}</Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="bg-white p-3 rounded-lg shadow-sm mb-3">
                    <h3 className="text-lg font-bold mb-3">{currentQuestion.text}</h3>

                    {gamePhase === "question" && !waitingForHost ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type your answer..."
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && submitAnswer()}
                        />
                        <Button onClick={submitAnswer} className="bg-blue-600 hover:bg-blue-700">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="font-medium">Your answer: {answer}</p>
                        {isCorrect !== null ? (
                          <p className={`font-bold ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                            {isCorrect ? "Correct!" : "Incorrect!"}
                          </p>
                        ) : (
                          <p className="text-blue-600 font-medium">Waiting for host to verify...</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">Your Score</span>
                      <span className="font-bold text-blue-600">{score}</span>
                    </div>
                    <Progress value={(score / (rounds.length * 1200)) * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            )}

            {gamePhase === "results" && currentQuestion && (
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-lg text-blue-900">Question Results</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="bg-white p-3 rounded-lg shadow-sm mb-3">
                    <Badge className="bg-blue-100 text-blue-800 mb-2">Question {currentQuestion.id}</Badge>
                    <h3 className="text-lg font-bold mb-1">{currentQuestion.text}</h3>
                    <p className="text-lg text-blue-600 font-bold mb-2">Answer: {currentQuestion.answer}</p>

                    <div className="space-y-1 mt-2">
                      <p className="font-medium text-sm">All Player Results:</p>
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
                </CardContent>
              </Card>
            )}

            {gamePhase === "guessing" && (
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-lg text-blue-900">Key Phrase Guess</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <Alert className="mb-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Waiting for host verification</AlertTitle>
                    <AlertDescription>
                      The host is verifying your key phrase guess: <strong>{keyPhrase}</strong>
                    </AlertDescription>
                  </Alert>

                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full animate-pulse" style={{ width: "100%" }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {gamePhase === "roundSummary" && (
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-lg text-blue-900">Round {currentRound} Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="bg-white p-3 rounded-lg shadow-sm mb-3 text-center">
                    <h3 className="text-xl font-bold mb-1">Round Complete!</h3>
                    <p className="text-lg text-blue-600 font-bold mb-2">
                      The key phrase was: {currentRoundData.keyPhrase}
                    </p>
                    <p className="text-sm text-gray-500 mb-2">
                      {revealedPieces.length} of {currentRoundData.questions.length} puzzle pieces revealed
                    </p>
                  </div>

                  <div className="mb-3">
                    <h4 className="font-medium mb-2">Round {currentRound} Leaderboard</h4>
                    <RankingBoard
                      players={[
                        { id: 1, name: "You", score: roundScores[currentRound - 1] },
                        { id: 2, name: "Player2", score: Math.floor(Math.random() * 500) },
                        { id: 3, name: "Player3", score: Math.floor(Math.random() * 400) },
                        { id: 4, name: "Player4", score: Math.floor(Math.random() * 300) },
                      ].sort((a, b) => b.score - a.score)}
                    />
                  </div>

                  <div className="text-center text-sm text-gray-500">
                    {currentRound < rounds.length ? "Next round starting soon..." : "Calculating final results..."}
                  </div>
                </CardContent>
              </Card>
            )}

            {gamePhase === "final" && (
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-lg text-blue-900">Final Results</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="bg-white p-3 rounded-lg shadow-sm mb-3 text-center">
                    <h3 className="text-xl font-bold mb-1">Game Complete!</h3>
                    <p className="text-lg text-blue-600 font-bold mb-2">All rounds completed</p>
                  </div>

                  <div className="mb-3">
                    <h4 className="font-medium mb-2">Final Leaderboard</h4>
                    <RankingBoard
                      players={[
                        { id: 1, name: "You", score },
                        { id: 2, name: "Player2", score: Math.floor(Math.random() * 1000 + 500) },
                        { id: 3, name: "Player3", score: Math.floor(Math.random() * 800 + 400) },
                        { id: 4, name: "Player4", score: Math.floor(Math.random() * 600 + 300) },
                      ].sort((a, b) => b.score - a.score)}
                    />
                  </div>

                  <div className="mt-3">
                    <h4 className="font-medium mb-2">Your Round Scores</h4>
                    <div className="bg-white p-2 rounded-lg border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-center p-1">Round 1</th>
                            <th className="text-center p-1">Round 2</th>
                            <th className="text-center p-1">Round 3</th>
                            <th className="text-center p-1">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="text-center p-1">{roundScores[0]}</td>
                            <td className="text-center p-1">{roundScores[1]}</td>
                            <td className="text-center p-1">{roundScores[2]}</td>
                            <td className="text-center p-1 font-bold">{score}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-center">
                    <Button onClick={() => navigate("/player")} className="bg-blue-600 hover:bg-blue-700">
                      Exit Game
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {gamePhase !== "waiting" &&
              gamePhase !== "final" &&
              gamePhase !== "guessing" &&
              gamePhase !== "roundSummary" && (
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-lg text-blue-900">Guess the Key Phrase</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-sm text-gray-500 mb-2">
                        If you think you know the key phrase, you can guess it now.
                      </p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type the key phrase..."
                          value={keyPhrase}
                          onChange={(e) => setKeyPhrase(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && submitKeyPhrase()}
                        />
                        <Button onClick={submitKeyPhrase} className="bg-blue-600 hover:bg-blue-700">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
          </div>
        </div>
      </div>
    </div>
  )
}

