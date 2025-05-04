"use client"

import RankingBoard from "@/components/ranking-board"
import GameLayout from "../../../components/gameLayout"
import AnswerCard from "../../../components/game/answerCard"
import KeywordCard from "../../../components/game/keywordCard"
import Panel from "../../../components/game/panel"
import { useGameContext, GamePhase } from "../../../hooks/useGameContext"

export default function PlayerGame() {
  const { gameState, submitAnswer, submitKeyword } = useGameContext()

  return (
    <GameLayout revealed={gameState.revealed} imageData={gameState.image}>
      {gameState.phase === GamePhase.CONNECTING &&
        <Panel title="Connecting to server...">
          {gameState.error ?? "Waiting for server response..."}
        </Panel>
      }
      {gameState.phase === GamePhase.PLAY &&
        <>
          {gameState.question &&
            <AnswerCard currentQuestion={gameState.question}
              submitAnswer={gameState.isPlayer ? submitAnswer : null} />
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
        <Panel title="Leaderboards">
          <RankingBoard players={gameState.players} />
        </Panel>
      }
      {(gameState.phase === GamePhase.PLAY || gameState.phase === GamePhase.QUESTION_RESULTS)
        && gameState.keywordLength &&
        <KeywordCard keywordLength={gameState.keywordLength}
          submitKeyword={gameState.isPlayer ? submitKeyword : null} />
      }
    </GameLayout>
  )
}

