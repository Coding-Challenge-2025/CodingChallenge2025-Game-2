import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from 'react-router-dom'
import { Users, User, Eye } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/*<h1 className="text-4xl font-bold text-center mb-8 text-indigo-900">Puzzle Quiz Game</h1>*/}
        <img src="/logo.png" className="size-60 mx-auto mb-4" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow bg-indigo-100">
            <CardHeader className="text-center">
              <div className="mx-auto bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-indigo-600" />
              </div>
              <CardTitle className="text-xl text-indigo-900">Host</CardTitle>
              <CardDescription>Create and manage quiz games</CardDescription>
            </CardHeader>
            {/*<CardContent className="text-center text-sm text-gray-600">
              Create a new room, manage questions, and control the game flow.
            </CardContent>*/}
            <CardFooter>
              <Link to="/host" className="w-full">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">Enter as Host</Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="hover:shadow-lg transition-shadow bg-indigo-100">
            <CardHeader className="text-center">
              <div className="mx-auto bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mb-2">
                <User className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl text-purple-900">Player</CardTitle>
              <CardDescription>Join and play in a quiz game</CardDescription>
            </CardHeader>
            {/*<CardContent className="text-center text-sm text-gray-600">
              Join a room with a code, answer questions, and compete with other players.
            </CardContent>*/}
            <CardFooter>
              <Link to="/player" className="w-full">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">Enter as Player</Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="hover:shadow-lg transition-shadow bg-indigo-100">
            <CardHeader className="text-center">
              <div className="mx-auto bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mb-2">
                <Eye className="h-8 w-8 text-pink-600" />
              </div>
              <CardTitle className="text-xl text-pink-900">Audience</CardTitle>
              <CardDescription>Watch the game unfold</CardDescription>
            </CardHeader>
            {/*<CardContent className="text-center text-sm text-gray-600">
              Observe the puzzle reveal and see the rankings without participating.
            </CardContent>*/}
            <CardFooter>
              <Link to="/audience" className="w-full">
                <Button className="w-full bg-pink-600 hover:bg-pink-700">Enter as Audience</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

