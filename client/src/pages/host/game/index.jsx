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
    markAnswer,
    markKeyword,
    revealRoundScore,
    revealLeaderboards } = useGameContext()

  useEffect(() => {
    console.log(gameState)
  }, [gameState]);

  return (
    <GameLayout revealed={gameState.revealed} imageData={gameState.image} notifications={gameState.notifications}>
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
              <div>
                <Button onClick={startQuestion}>Start Question</Button>
                <Button onClick={revealRoundScore}>Reveal Scores</Button>
                <Button onClick={revealLeaderboards}>Reveal Leaderboards</Button>
                <Button onClick={revealClue}>Reveal Clue</Button>
              </div>
              {gameState.answerQueue.length > 0 &&
                <div>
                  <Button>Finish and Reveal Answers</Button>
                  {gameState.answerQueue.forEach((value, id) =>
                    <Card key={value.name} className={clsx("p-2", value.correct && "bg-lime-400")}
                      onClick={() => markAnswer(id)}>
                      {value.name}: <strong>{value.answer}</strong>
                    </Card>)
                  }
                </div>
              }
            </AnswerCard>
          }
          {gameState.keywordQueue.length > 0 &&
            <Panel title="Keyword Received">
              <div>
                <Button>Announce Results</Button>
                {gameState.keywordQueue.forEach((value, id) =>
                  <Card key={value.name} className={clsx("p-2", value.correct && "bg-lime-400")}
                    onClick={() => markKeyword(id)}>
                    {value.name}: <strong>{value.keyword}</strong>
                  </Card>)
                }
              </div>
            </Panel>
          }
          <Panel title="Main Controls">
            <div>
              <div>Players: <strong>{gameState.connectedPlayers?.toString()}</strong></div>
              {gameState.keyword && <div>Keyword: <strong>{gameState.keyword}</strong></div>}
            </div>
            {!gameState.gameStarted && <Button onClick={startGame}>Start Game</Button>}
            {gameState.gameStarted &&
              <>
                <div><Button onClick={endGame}>End Game</Button></div>
                <div className="grid grid-cols-4">
                  {gameState.revealed.map((_, id) => {
                    return (
                      <div key={id} className="m-1">
                        {<Button onClick={() => selectQuestion(id)}>Choose question {id + 1}</Button>}
                      </div>)
                  })}
                </div>
              </>}
          </Panel>
        </>
      }
    </GameLayout>
  )
}

