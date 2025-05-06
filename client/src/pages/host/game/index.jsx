"use client"

import GameLayout from "../../../components/gameLayout"
import Panel from "../../../components/game/panel"
import AnswerCard from "@/components/game/answerCard"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useGameContext, GamePhase } from "../../../hooks/useGameContext"
import { useEffect } from "react"

export default function HostGame() {
  const { gameState, timeLeft,
    startGame,
    endGame,
    selectQuestion,
    startQuestion,
    revealClue,
    resolveAnswers,
    resolveKeywords,
    revealRoundScore,
    revealLeaderboards } = useGameContext()

  useEffect(() => {
    console.log(gameState)
  }, [gameState]);

  return (
    <GameLayout revealed={gameState.revealed} imageData={gameState.image}>
      {gameState.phase === GamePhase.CONNECTING &&
        <Panel title="Connecting to server...">
          {gameState.error ?? "Waiting for server response..."}
        </Panel>
      }
      {gameState.phase !== GamePhase.CONNECTING &&
        <>
          {gameState.question &&
            <AnswerCard currentQuestion={gameState.question}
              timeLeft={timeLeft}>
              {gameState.question.answer &&
                <h3 className="text-lg font-bold p-4">Answer: {gameState.question.answer}</h3>}
              <Button onClick={startQuestion}>Start Question</Button>
              <Button onClick={revealRoundScore}>Reveal Scores</Button>
              <Button onClick={revealLeaderboards}>Reveal Leaderboards</Button>
              <Button onClick={revealClue}>Reveal Clue</Button>
            </AnswerCard>
          }
          <Panel title="Main Controls">
            <div>
              <div>Players: <strong>{gameState.connectedPlayers?.toString()}</strong></div>
              {gameState.keyword && <div>Keyword: <strong>{gameState.keyword}</strong></div>}
            </div>
            {!gameState.gameStarted && <Button onClick={startGame}>Start Game</Button>}
            {gameState.gameStarted &&
              <>
                <Button onClick={endGame}>End Game</Button>
                {gameState.revealed.map((_, id) => {
                  return (
                    <div key={id} className="mr-2">
                      {<Button onClick={() => selectQuestion(id)}>Choose question {id}</Button>}
                    </div>)
                })}
              </>}
          </Panel>
        </>
      }
    </GameLayout>
  )
}

