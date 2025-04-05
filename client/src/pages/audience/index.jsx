import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AudienceJoin() {
  const [roomId, setRoomId] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleRoomSubmit = (e) => {
    e.preventDefault()
    if (!roomId.trim()) {
      setError("Please enter a room code")
      return
    }

    // Example validation or logic before navigation
    navigate("/audience/game")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-pink-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Eye className="h-8 w-8 text-pink-600" />
          </div>
          <CardTitle className="text-2xl text-pink-900">Join as Audience</CardTitle>
          <CardDescription>Enter the room code to watch the game</CardDescription>
        </CardHeader>
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
            <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700">
              Join as Audience
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
