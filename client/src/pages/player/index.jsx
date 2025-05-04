"use client"

import { useState } from "react"
import { useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useGameContext } from "../../hooks/useGameContext"

export default function PlayerJoin() {
  const { authenticate } = useGameContext();
  const [roomId, setRoomId] = useState("")
  const [username, setUsername] = useState("")
  const [step, setStep] = useState(1)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleRoomSubmit = (e) => {
    e.preventDefault()
    if (!roomId.trim()) {
      setError("Please enter a room code")
      return
    }

    // In a real app, you would validate the room ID against a database
    // For this demo, we'll just move to the next step
    setStep(2)
    setError("")
  }

  const handleUsernameSubmit = (e) => {
    e.preventDefault()
    if (!username.trim()) {
      setError("Please enter a username")
      return
    }

    // In a real app, you would register the player in the room
    // For this demo, we'll just navigate to the game page
    authenticate(roomId, username);
    navigate("/player/game")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-indigo-100">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-purple-900">
            {step === 1 ? "Join a Game" : "Pick a name"}
          </CardTitle>
          <CardDescription>
            {step === 1 ? "Enter the room code to join" : "Choose a username for the game"}
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
                    placeholder="Enter room code (e.g., ABC123)"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="text-center text-xl font-bold"
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                Join Room
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleUsernameSubmit}>
            <CardContent>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={15}
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
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

