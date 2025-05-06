"use client"

import RankingBoard from "@/components/ranking-board"
import GameLayout from "../../../components/gameLayout"
import AnswerCard from "../../../components/game/answerCard"
import KeywordCard from "../../../components/game/keywordCard"
import Panel from "../../../components/game/panel"
import { useGameContext, GamePhase } from "../../../hooks/useGameContext"
import clsx from "clsx"

export default function PlayerGame() {
  const { gameState, submitAnswer, submitKeyword, timeLeft } = useGameContext()

  return (
    <GameLayout revealed={gameState.revealed} imageData={gameState.image}>
      {gameState.phase === GamePhase.CONNECTING &&
        <Panel title="Connecting to server...">
          {gameState.error ?? "Waiting for server response..."}
        </Panel>
      }
      {/*{JSON.stringify(gameState)}*/}
      {gameState.phase === GamePhase.PLAY &&
        <>
          {gameState.question && timeLeft !== undefined &&
            <AnswerCard currentQuestion={gameState.question}
              submitAnswer={(gameState.isPlayer && timeLeft) > 0 ? submitAnswer : null}
              timeLeft={timeLeft}>
              {gameState.question.answer &&
                <h3 className={clsx("text-lg font-bold p-4",
                  gameState.question.correct && "text-green-500",
                  !gameState.question.correct && "text-red-500")}>
                  Answer: {gameState.question.answer}
                </h3>}
            </AnswerCard>
          }
          {!gameState.question &&
            <Panel title="Waiting for host">
              Game will start soon, be ready!
            </Panel>
          }
        </>
      }
      {(gameState.phase === GamePhase.QUESTION_RESULTS || gameState.phase == GamePhase.GAME_COMPLETE)
        && gameState.players &&
        <Panel title="Results">
          <RankingBoard players={gameState.players} />
        </Panel>
      }
      {(gameState.phase === GamePhase.PLAY || gameState.phase === GamePhase.QUESTION_RESULTS)
        && gameState.keywordLength &&
        <KeywordCard keywordLength={gameState.keywordLength}
          questionsAnswered={gameState.questionsAnswered}
          submitKeyword={gameState.isPlayer ? submitKeyword : undefined}
          wrongKeywords={gameState.wrongKeywords} />
      }
    </GameLayout>
  )
}

