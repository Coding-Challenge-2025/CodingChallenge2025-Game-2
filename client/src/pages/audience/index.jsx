"use client"

import { useState } from "react"
import { useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useGameContext } from "../../hooks/useGameContext"

export default function PlayerJoin() {
  const { authenticateAudience } = useGameContext();
  const [roomId, setRoomId] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleRoomSubmit = (e) => {
    e.preventDefault()
    if (!roomId.trim()) {
      setError("Please enter a room code")
      return
    }

    authenticateAudience(roomId);
    navigate("/player/game")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-indigo-100">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-purple-900">
            Join a Game
          </CardTitle>
          <CardDescription>
            {step === 1 ? "Enter the room code to join" : "Choose a username for the game"}
          </CardDescription>
        </CardHeader>

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
            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
              Join Room
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

