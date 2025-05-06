"use client"

import { useState } from "react"
import { useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useGameContext } from "../../hooks/useGameContext"

export default function HostJoin() {
  const { authenticateHost } = useGameContext();
  const [roomId, setRoomId] = useState("")
  const [password, setPassword] = useState("")
  const [step, setStep] = useState(1)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleRoomSubmit = (e) => {
    e.preventDefault()
    if (!roomId.trim()) {
      setError("Please enter a room code")
      return
    }

    setStep(2)
    setError("")
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (!password.trim()) {
      setError("Please enter a password")
      return
    }

    authenticateHost(roomId, password);
    navigate("/host/game")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-indigo-100">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-blue-900">
            {step === 1 ? "Join host dashboard" : "Enter password"}
          </CardTitle>
          <CardDescription>
            {step === 1 ? "Enter the room code to join" : "Enter host password"}
          </CardDescription>
        </CardHeader>

        {step === 1 ? (
          <form onSubmit={handleRoomSubmit}>
            <CardContent>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="roomId">Room Code</Label>
                  <Input
                    id="roomId"
                    placeholder="Enter room code (e.g., A1B2)"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    maxLength={4}
                    className="text-center text-xl font-bold"
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                Join Room
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit}>
            <CardContent>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    maxLength={64}
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                Join Game
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => setStep(1)}>
                Back
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}

