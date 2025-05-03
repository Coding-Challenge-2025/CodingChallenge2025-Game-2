"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import PuzzleBoard from "@/components/puzzle-board"
import RankingBoard from "@/components/ranking-board"
import { ArrowRight, Clock, Check, X, AlertCircle } from "lucide-react"
import Timer from "@/components/timer"

export default function HostGame() {
  const navigate = useNavigate()
  const [currentRound, setCurrentRound] = useState(1)
  const [timeLeft, setTimeLeft] = useState(15)
  const [gamePhase, setGamePhase] = useState("selection") // selection, question, verification, results, roundSummary, final, phraseGuess
  const [revealedPieces, setRevealedPieces] = useState([])
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [playerAnswers, setPlayerAnswers] = useState([])
  const [keyPhraseGuess, setKeyPhraseGuess] = useState(null)
  const [answeredQuestions, setAnsweredQuestions] = useState([])
  const [players, setPlayers] = useState([
    { id: 1, name: "Player1", score: 0, roundScores: [0, 0, 0], answered: false, correct: false },
    { id: 2, name: "Player2", score: 0, roundScores: [0, 0, 0], answered: false, correct: false },
    { id: 3, name: "Player3", score: 0, roundScores: [0, 0, 0], answered: false, correct: false },
    { id: 4, name: "Player4", score: 0, roundScores: [0, 0, 0], answered: false, correct: false },
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

  // Timer effect
  useEffect(() => {
    if (gamePhase === "question" && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)

      return () => clearTimeout(timer)
    } else if (gamePhase === "question" && timeLeft === 0) {
      moveToVerification()
    }
  }, [timeLeft, gamePhase])

  // Simulate player answers
  useEffect(() => {
    if (gamePhase === "question" && selectedQuestion) {
      const answerTimer = setTimeout(() => {
        const updatedPlayers = players.map((player) => {
          const willAnswer = Math.random() > 0.2

          return {
            ...player,
            answered: willAnswer,
            answer: willAnswer ? generateRandomAnswer(selectedQuestion) : "",
          }
        })

        setPlayers(updatedPlayers)

        // Add player answers to the verification queue
        const newAnswers = updatedPlayers
          .filter((p) => p.answered)
          .map((p) => ({
            playerId: p.id,
            playerName: p.name,
            answer: p.answer,
            isCorrect: p.answer.toLowerCase() === selectedQuestion.answer.toLowerCase(),
          }))

        setPlayerAnswers(newAnswers)
      }, 5000)

      return () => clearTimeout(answerTimer)
    }
  }, [selectedQuestion, gamePhase])

  // Simulate a player guessing the key phrase
  useEffect(() => {
    if (gamePhase === "selection" && Math.random() > 0.9 && revealedPieces.length > 3) {
      const randomPlayer = players[Math.floor(Math.random() * players.length)]

      setKeyPhraseGuess({
        playerId: randomPlayer.id,
        playerName: randomPlayer.name,
        guess: Math.random() > 0.7 ? rounds[currentRound - 1].keyPhrase : "WRONG GUESS",
      })

      setGamePhase("phraseGuess")
    }
  }, [gamePhase, revealedPieces.length])

  const selectQuestion = (question) => {
    setSelectedQuestion(question)
    setTimeLeft(15)
    setGamePhase("question")
  }

  const moveToVerification = () => {
    setGamePhase("verification")
  }

  const generateRandomAnswer = (question) => {
    // 70% chance to get the correct answer
    if (Math.random() > 0.3) {
      return question.answer
    }

    // Otherwise return a wrong answer
    const wrongAnswers = {
      "What is the capital of France?": ["London", "Berlin", "Rome"],
      "Which planet is known as the Red Planet?": ["Venus", "Jupiter", "Saturn"],
      "What is the largest mammal?": ["Elephant", "Giraffe", "Whale Shark"],
      // Add more wrong answers for other questions as needed
    }

    const options = wrongAnswers[question.text] || ["Wrong Answer"]
    return options[Math.floor(Math.random() * options.length)]
  }

  const verifyAnswers = () => {
    // Process player answers
    const correctPlayers = playerAnswers.filter((p) => p.isCorrect)

    // Update player scores
    const updatedPlayers = players.map((player) => {
      const playerAnswer = playerAnswers.find((p) => p.playerId === player.id)
      const isCorrect = playerAnswer?.isCorrect || false
      const roundIndex = currentRound - 1

      // Update round scores
      const roundScores = [...player.roundScores]
      if (isCorrect) {
        roundScores[roundIndex] = (roundScores[roundIndex] || 0) + 100
      }

      return {
        ...player,
        correct: isCorrect,
        roundScores,
        score: isCorrect ? player.score + 100 : player.score,
      }
    })

    setPlayers(updatedPlayers)

    // Reveal puzzle pieces for correct answers
    if (correctPlayers.length > 0) {
      setRevealedPieces([...revealedPieces, selectedQuestion.id])
    }

    // Add to answered questions
    setAnsweredQuestions([...answeredQuestions, selectedQuestion.id])

    setGamePhase("results")
  }

  const nextQuestion = () => {
    // Reset player states for next question
    const resetPlayers = players.map((player) => ({
      ...player,
      answered: false,
      correct: false,
      answer: "",
    }))
    setPlayers(resetPlayers)
    setPlayerAnswers([])

    // Check if all questions are answered
    const currentRoundQuestions = rounds[currentRound - 1].questions
    if (answeredQuestions.length >= currentRoundQuestions.length) {
      setGamePhase("roundSummary")
    } else {
      setGamePhase("selection")
    }
  }

  const nextRound = () => {
    if (currentRound < rounds.length) {
      setCurrentRound(currentRound + 1)
      setRevealedPieces([])
      setAnsweredQuestions([])
      setGamePhase("selection")
    } else {
      setGamePhase("final")
    }
  }

  const verifyKeyPhrase = (isCorrect) => {
    if (isCorrect) {
      // Update player score
      const updatedPlayers = players.map((player) => {
        if (player.id === keyPhraseGuess.playerId) {
          const roundIndex = currentRound - 1
          const roundScores = [...player.roundScores]
          roundScores[roundIndex] = (roundScores[roundIndex] || 0) + 500

          return {
            ...player,
            roundScores,
            score: player.score + 500,
          }
        }
        return player
      })

      setPlayers(updatedPlayers)

      // Move to round summary or final based on current round
      if (currentRound < rounds.length) {
        setGamePhase("roundSummary")
      } else {
        setGamePhase("final")
      }
    } else {
      // Continue the game
      setKeyPhraseGuess(null)
      setGamePhase("selection")
    }
  }

  const endGame = () => {
    navigate.push("/host/room")
  }

  const currentRoundData = rounds[currentRound - 1]
  const availableQuestions = currentRoundData.questions.filter((q) => !answeredQuestions.includes(q.id))

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-2">
      <div className="max-w-full mx-auto">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-900">
            {gamePhase === "final" ? "Game Complete" : `Round ${currentRound} of ${rounds.length}`}
          </h1>
          {gamePhase === "question" && (
            <Timer timeLeft={timeLeft} />
          )}
        </div>

        {gamePhase === "phraseGuess" && (
          <Alert className="mb-2 bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Key Phrase Guess</AlertTitle>
            <AlertDescription className="text-yellow-700">
              <p className="mb-1">
                <strong>{keyPhraseGuess.playerName}</strong> has guessed the key phrase:{" "}
                <strong>{keyPhraseGuess.guess}</strong>
              </p>
              <div className="flex gap-2 mt-1">
                <Button onClick={() => verifyKeyPhrase(true)} className="bg-green-600 hover:bg-green-700" size="sm">
                  <Check className="mr-1 h-3 w-3" />
                  Correct
                </Button>
                <Button
                  onClick={() => verifyKeyPhrase(false)}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  size="sm"
                >
                  <X className="mr-1 h-3 w-3" />
                  Incorrect
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
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
                <div className="mt-2 p-2 bg-white rounded-lg border">
                  <p className="font-medium text-blue-900 text-sm">Key Phrase</p>
                  <p className="text-lg font-bold text-blue-600">{currentRoundData.keyPhrase}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle and right columns - Questions and rankings */}
          <div className="lg:col-span-2">
            {gamePhase === "selection" && (
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-lg text-blue-900">Select a Question</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {currentRoundData.questions.map((question) => (
                      <Button
                        key={question.id}
                        onClick={() => selectQuestion(question)}
                        disabled={answeredQuestions.includes(question.id)}
                        className={`h-16 ${answeredQuestions.includes(question.id)
                          ? "bg-gray-200 text-gray-500"
                          : "bg-blue-600 hover:bg-blue-700"
                          }`}
                      >
                        Question {question.id}
                      </Button>
                    ))}
                  </div>

                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <h3 className="text-lg font-bold mb-2">Round Progress</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {answeredQuestions.length} of {currentRoundData.questions.length} questions answered
                    </p>
                    <Progress
                      value={(answeredQuestions.length / currentRoundData.questions.length) * 100}
                      className="h-2 mb-2"
                    />

                    <div className="flex flex-wrap gap-1 mt-2">
                      {currentRoundData.questions.map((question) => (
                        <Badge
                          key={question.id}
                          variant={answeredQuestions.includes(question.id) ? "outline" : "default"}
                          className={
                            answeredQuestions.includes(question.id) ? "bg-gray-100" : "bg-blue-100 text-blue-800"
                          }
                        >
                          {question.id}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {gamePhase === "question" && selectedQuestion && (
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-lg text-blue-900">Current Question</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="bg-white p-3 rounded-lg shadow-sm mb-3">
                    <div className="flex justify-between mb-2">
                      <Badge className="bg-blue-100 text-blue-800">Question {selectedQuestion.id}</Badge>
                      <span className="text-sm text-gray-500">Time left: {timeLeft}s</span>
                    </div>
                    <h3 className="text-lg font-bold mb-2">{selectedQuestion.text}</h3>
                    <p className="text-gray-500">Waiting for players to answer...</p>
                    <p className="text-sm text-blue-600 mt-1">
                      <strong>Answer:</strong> {selectedQuestion.answer}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {players.map((player) => (
                      <div
                        key={player.id}
                        className={`p-2 rounded-lg border ${player.answered ? "bg-blue-50 border-blue-200" : "bg-white"
                          }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{player.name}</span>
                          <span
                            className={player.answered ? "text-blue-600 font-bold text-sm" : "text-gray-400 text-sm"}
                          >
                            {player.answered ? "Answered" : "Waiting"}
                          </span>
                        </div>
                        {player.answered && <p className="text-xs mt-1">Answer: {player.answer}</p>}
                        <Progress value={player.answered ? 100 : 0} className="h-1 mt-1" />
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex justify-end">
                    <Button onClick={moveToVerification} className="bg-blue-600 hover:bg-blue-700" size="sm">
                      Verify Answers
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {gamePhase === "verification" && selectedQuestion && (
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-lg text-blue-900">Verify Answers</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="bg-white p-3 rounded-lg shadow-sm mb-3">
                    <Badge className="bg-blue-100 text-blue-800 mb-2">Question {selectedQuestion.id}</Badge>
                    <h3 className="text-lg font-bold mb-1">{selectedQuestion.text}</h3>
                    <p className="text-lg text-blue-600 font-bold">Answer: {selectedQuestion.answer}</p>
                  </div>

                  <div className="space-y-2 mb-3">
                    {playerAnswers.length > 0 ? (
                      playerAnswers.map((playerAnswer, index) => (
                        <div
                          key={index}
                          className={`p-2 rounded-lg border ${playerAnswer.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                            }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{playerAnswer.playerName}</span>
                            <span
                              className={
                                playerAnswer.isCorrect
                                  ? "text-green-600 font-bold text-sm"
                                  : "text-red-600 font-bold text-sm"
                              }
                            >
                              {playerAnswer.isCorrect ? "Correct" : "Incorrect"}
                            </span>
                          </div>
                          <p className="text-xs mt-1">Answer: {playerAnswer.answer}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-2 text-gray-500">No players answered this question</div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={verifyAnswers} className="bg-blue-600 hover:bg-blue-700" size="sm">
                      Reveal Results
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {gamePhase === "results" && selectedQuestion && (
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-lg text-blue-900">Results</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="bg-white p-3 rounded-lg shadow-sm mb-3">
                    <Badge className="bg-blue-100 text-blue-800 mb-2">Question {selectedQuestion.id}</Badge>
                    <h3 className="text-lg font-bold mb-1">{selectedQuestion.text}</h3>
                    <p className="text-lg text-blue-600 font-bold">Answer: {selectedQuestion.answer}</p>
                    <p className="text-md text-blue-800 font-medium mt-1">Keyword: {selectedQuestion.keyword}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {players.map((player) => (
                      <div
                        key={player.id}
                        className={`p-2 rounded-lg border ${player.correct
                          ? "bg-green-50 border-green-200"
                          : player.answered
                            ? "bg-red-50 border-red-200"
                            : "bg-gray-50 border-gray-200"
                          }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{player.name}</span>
                          <span
                            className={
                              player.correct
                                ? "text-green-600 font-bold text-sm"
                                : player.answered
                                  ? "text-red-600 font-bold text-sm"
                                  : "text-gray-400 text-sm"
                            }
                          >
                            {player.correct ? "Correct" : player.answered ? "Incorrect" : "No answer"}
                          </span>
                        </div>
                        <div className="mt-1 flex justify-between items-center">
                          <span className="text-xs text-gray-500">Score</span>
                          <span className="font-bold">{player.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex justify-end">
                    <Button onClick={nextQuestion} className="bg-blue-600 hover:bg-blue-700" size="sm">
                      Next Question
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
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
                      players={players
                        .map((p) => ({
                          ...p,
                          score: p.roundScores[currentRound - 1] || 0,
                        }))
                        .sort((a, b) => b.score - a.score)}
                    />
                  </div>

                  <div className="mt-3 flex justify-end">
                    <Button onClick={nextRound} className="bg-blue-600 hover:bg-blue-700" size="sm">
                      {currentRound < rounds.length ? "Next Round" : "See Final Results"}
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
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

                  <div className="mt-3 flex justify-end">
                    <Button onClick={endGame} className="bg-blue-600 hover:bg-blue-700" size="sm">
                      End Game
                    </Button>
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

