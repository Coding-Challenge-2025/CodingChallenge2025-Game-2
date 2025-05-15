"use client"

import GameLayout from "../../../components/gameLayout"
import Panel from "../../../components/game/panel"
import AnswerCard from "@/components/game/answerCard"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useGameContext, GamePhase } from "../../../hooks/useGameContext"
import { useEffect, useState } from "react"
import clsx from "clsx"
import { Check, X } from "lucide-react"

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
    revealLeaderboards,
    requestClientList } = useGameContext()

  useEffect(() => {
    console.log(gameState)
  }, [gameState]);

  useEffect(() => {
    const interval = setInterval(() => requestClientList(), 1000);
    return () => clearInterval(interval);
  }, []);

  const [selectedQuestions, setSelectedQuestions] = useState(Array(12).fill(false));
  const handleQuestionSelect = (id) => {
    console.log("SEL", id);
    const updated = [...selectedQuestions];
    updated[id] = true;
    setSelectedQuestions(updated);
    selectQuestion(id);
  };

  const [step, setStep] = useState(0);

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
              <div className="flex w-full gap-2">
                <Button className="flex-1" disabled={step !== 1} onClick={() => { startQuestion(); setStep(2) }}>Start Question</Button>
                <Button className="flex-1" disabled={step !== 3} onClick={() => { revealRoundScore(); setStep(4); }}>Reveal Scores</Button>
                <Button className="flex-1" disabled={step !== 4} onClick={() => { revealLeaderboards(); setStep(0); }}>Reveal Leaderboards</Button>
                <Button className="flex-1" disabled={step === 1 || step === 2 || gameState.revealed[gameState.question.id]} onClick={() => { revealClue(); }}>Reveal Clue</Button>
              </div>
              {gameState.answerQueue.length > 0 &&
                <div>
                  <Button disabled={step !== 2} onClick={() => { resolveAnswers(); setStep(3); }}>Finish and Reveal Answers</Button>
                  {gameState.answerQueue.map((value, id) =>
                    <Card key={value.name} className={clsx("p-2", value.correct && "bg-lime-400")}>
                      {!value.correct && <Button onClick={() => markAnswer(id, true)}><Check /></Button>}
                      {value.correct && <Button onClick={() => markAnswer(id, false)}><X /></Button>}
                      <div className="inline ml-2">{value.name}: <strong>{value.answer}</strong></div>
                    </Card>)
                  }
                </div>
              }
            </AnswerCard>
          }
          {gameState.keywordQueue.length > 0 &&
            <Panel title="Keyword Received">
              <div>
                <Button onClick={resolveKeywords}>Announce Results</Button>
                {gameState.keywordQueue.map((value, id) =>
                  <Card key={value.name} className={clsx("p-2", value.correct && "bg-lime-400")}>
                    {!value.correct && <Button onClick={() => markKeyword(id, true)}><Check /></Button>}
                    {value.correct && <Button onClick={() => markKeyword(id, false)}><X /></Button>}
                    <div className="inline ml-2">{value.name}: <strong>{value.keyword}</strong></div>
                  </Card>)
                }
              </div>
            </Panel>
          }
          <Panel title="Main Controls">
            <div>
              {gameState.connectedPlayers &&
                <div>Players ({gameState.connectedPlayers.length}): <strong>{gameState.connectedPlayers.toString()}</strong></div>
              }
              {gameState.keyword && <div>Keyword: <strong>{gameState.keyword}</strong></div>}
            </div>
            {!gameState.gameStarted && <Button disabled={step === 999} onClick={startGame}>Start Game</Button>}
            {gameState.gameStarted &&
              <>
                <div>
                  <Button onClick={() => {
                    endGame();
                    setStep(999);
                  }}>End Game</Button>
                </div>
                <div className="grid grid-cols-4">
                  {gameState.revealed.map((_, id) => {
                    return (
                      <div key={id} className="m-1 w-full">
                        {<Button disabled={selectedQuestions[id] || step !== 0} onClick={() => {
                          handleQuestionSelect(id);
                          setStep(1);
                        }}>
                          Choose question {id + 1}
                        </Button>}
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

