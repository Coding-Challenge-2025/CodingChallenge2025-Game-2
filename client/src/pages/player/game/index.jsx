"use client"

import RankingBoard from "@/components/ranking-board"
import GameLayout from "../../../components/gameLayout"
import AnswerCard from "../../../components/game/answerCard"
import KeywordCard from "../../../components/game/keywordCard"
import Panel from "../../../components/game/panel"
import { useGameContext, GamePhase } from "../../../hooks/useGameContext"
import AnswerBoard from "../../../components/answerBoard"
import KeywordBoard from "../../../components/keywordBoard"

export default function PlayerGame() {
  const { gameState, submitAnswer, submitKeyword, timeLeft } = useGameContext()

  return (
    <GameLayout revealed={gameState.revealed} imageData={gameState.image} isPlayer={gameState.isPlayer}>
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
            </AnswerCard>
          }
          {!gameState.question &&
            <Panel title="Waiting for host">
              Game will start soon, be ready!
            </Panel>
          }
          {gameState.answerQueue.length > 0 &&
            <Panel title="Player Answers">
              <AnswerBoard answers={gameState.answerQueue} />
            </Panel>
          }
        </>
      }
      {(gameState.phase === GamePhase.QUESTION_RESULTS || gameState.phase == GamePhase.GAME_COMPLETE)
        && gameState.players &&
        <Panel title={gameState.keyword ? "Leaderboards" : "Round Results"}>
          <RankingBoard players={gameState.players} />
          {gameState.keyword && <h2 className="text-center font-bold text-xl m-4">{gameState.keyword}</h2>}
        </Panel>
      }
      {gameState.phase !== GamePhase.GAME_COMPLETE && !gameState.isPlayer
        && gameState.keywordQueue.length > 0 &&
        <Panel title="Keyword Received">
          <KeywordBoard keywords={gameState.keywordQueue} />
        </Panel>
      }
      {(gameState.phase === GamePhase.PLAY || gameState.phase === GamePhase.QUESTION_RESULTS)
        && gameState.keywordLength &&
        <KeywordCard keywordLength={gameState.keywordLength}
          questionsAnswered={gameState.revealed.filter((x) => x !== false).length}
          submitKeyword={gameState.isPlayer ? submitKeyword : undefined}
          wrongKeywords={gameState.wrongKeywords} />
      }
    </GameLayout>
  )
}

