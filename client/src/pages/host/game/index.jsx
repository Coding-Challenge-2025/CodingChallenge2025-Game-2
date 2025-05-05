"use client"

import RankingBoard from "@/components/ranking-board"
import GameLayout from "../../../components/gameLayout"
import Panel from "../../../components/game/panel"
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
    notifyCorrectKeyword } = useGameContext()

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
      {/*gameState.phase !== GamePhase.CONNECTING*/true &&
        <>
          {gameState.question &&
            <AnswerCard currentQuestion={gameState.question}
              timeLeft={timeLeft}>
              {gameState.question.answer &&
                <h3 className="text-lg font-bold p-4">Answer: {gameState.question.answer}</h3>}
            </AnswerCard>
          }
          <Panel title="Controls">
            {/*!gameState.gameStarted*/true && <Button onClick={startGame}>Start Game</Button>}
            {/*gameState.gameStarted*/true &&
              <>
                <Button onClick={endGame}>End Game</Button>
                <Button onClick={startQuestion}>Start question countdown</Button>
                {gameState.revealed.map((_, id) => {
                  return (
                    <div key={id}>
                      {<Button onClick={() => selectQuestion(id)}>Choose question {id}</Button>}
                      {<Button onClick={() => revealClue(id)}>Reveal clue {id}</Button>}
                    </div>)
                })}
              </>}
          </Panel>
        </>
      }
      {
        gameState.players &&
        <Panel title="Leaderboards">
          <RankingBoard players={gameState.players} />
        </Panel>
      }
    </GameLayout >
  )
}

