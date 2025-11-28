"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { MessageSquare, Send, Search, User, X, ImageIcon, FileText, Video, Mic, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Profile {
  id: string
  username: string
  first_name: string
  last_name: string
  avatar_url: string | null
}

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  read: boolean
  sender?: Profile
  file_url?: string | null
  file_type?: string | null
  file_name?: string | null
}

export default function MessagesPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [users, setUsers] = useState<Profile[]>([])
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (currentUser) {
      loadUsers()
    }
  }, [currentUser])

  useEffect(() => {
    if (selectedUser && currentUser) {
      loadMessages()
      const channel = supabase
        .channel(`messages-${selectedUser.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
          },
          (payload) => {
            if (
              (payload.new.sender_id === selectedUser.id && payload.new.receiver_id === currentUser.id) ||
              (payload.new.sender_id === currentUser.id && payload.new.receiver_id === selectedUser.id)
            ) {
              setMessages((prev) => [...prev, payload.new as Message])
              if (payload.new.receiver_id === currentUser.id) {
                supabase.from("messages").update({ read: true }).eq("id", payload.new.id).then()
              }
            }
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedUser, currentUser])

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }
    setCurrentUser(user)
    setLoading(false)
  }

  async function loadUsers() {
    const { data, error } = await supabase.from("profiles").select("*").neq("id", currentUser.id).order("username")

    if (!error && data) {
      setUsers(data)
    }
  }

  async function loadMessages() {
    if (!selectedUser || !currentUser) return

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id})`,
      )
      .order("created_at", { ascending: true })

    if (!error && data) {
      setMessages(data)
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("receiver_id", currentUser.id)
        .eq("sender_id", selectedUser.id)
        .eq("read", false)
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedUser || !currentUser) return

    const { error } = await supabase.from("messages").insert({
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
      content: newMessage.trim(),
    })

    if (!error) {
      setNewMessage("")
    }
  }

  async function deleteMessage(messageId: string) {
    const { error } = await supabase.from("messages").delete().eq("id", messageId).eq("sender_id", currentUser.id)

    if (!error) {
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
    }
  }

  async function sendFile(type: "image" | "video" | "document") {
    const fileUrl = prompt(
      `Enter ${type} URL:\n\nSupported formats:\n` +
        (type === "image"
          ? "- Images: .jpg, .jpeg, .png, .gif"
          : type === "video"
            ? "- Videos: .mp4, .mov, .avi"
            : "- Documents: .pdf, .doc, .docx"),
    )
    if (!fileUrl?.trim() || !selectedUser || !currentUser) return

    const { error } = await supabase.from("messages").insert({
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
      content: "",
      file_url: fileUrl.trim(),
      file_type: type,
      file_name: fileUrl.split("/").pop() || "file",
    })

    if (error) {
      alert("Failed to send file")
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        const audioUrl = URL.createObjectURL(audioBlob)

        // In production, you would upload this to Supabase Storage
        // For now, we'll send a placeholder message
        await supabase.from("messages").insert({
          sender_id: currentUser.id,
          receiver_id: selectedUser?.id,
          content: `🎤 Voice message (${recordingTime}s)`,
          file_url: audioUrl,
          file_type: "audio",
          file_name: "voice-message.webm",
        })

        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Auto-stop after 30 seconds
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 30) {
            stopRecording()
            return 30
          }
          return prev + 1
        })
      }, 1000)
    } catch (error) {
      alert("Could not access microphone")
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-100 to-pink-200 flex items-center justify-center">
        <div className="text-rose-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-100 to-pink-200 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-rose-900 mb-8 flex items-center gap-3">
            <MessageSquare className="w-10 h-10" />
            Chat
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
            {/* Users List */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 flex flex-col">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-rose-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/50 border-rose-200 focus:border-rose-400"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`w-full p-4 rounded-2xl text-left transition-all ${
                        selectedUser?.id === user.id
                          ? "bg-rose-500 text-white"
                          : "bg-white/50 hover:bg-white/80 text-rose-900"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url || "/placeholder.svg"}
                            alt={user.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-rose-200 flex items-center justify-center">
                            <User className="w-6 h-6 text-rose-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">
                            {user.first_name} {user.last_name}
                          </p>
                          <p
                            className={`text-sm truncate ${
                              selectedUser?.id === user.id ? "text-rose-100" : "text-rose-600"
                            }`}
                          >
                            @{user.username}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="md:col-span-2 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl flex flex-col">
              {selectedUser ? (
                <>
                  {/* Chat Header */}
                  <div className="p-6 border-b border-rose-200">
                    <div className="flex items-center gap-3">
                      {selectedUser.avatar_url ? (
                        <img
                          src={selectedUser.avatar_url || "/placeholder.svg"}
                          alt={selectedUser.username}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-rose-200 flex items-center justify-center">
                          <User className="w-7 h-7 text-rose-600" />
                        </div>
                      )}
                      <div>
                        <h2 className="text-xl font-bold text-rose-900">
                          {selectedUser.first_name} {selectedUser.last_name}
                        </h2>
                        <p className="text-sm text-rose-600">@{selectedUser.username}</p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-6">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_id === currentUser.id ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-3 relative group ${
                              message.sender_id === currentUser.id ? "bg-rose-500 text-white" : "bg-white text-rose-900"
                            }`}
                          >
                            {message.sender_id === currentUser.id && (
                              <button
                                onClick={() => deleteMessage(message.id)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}

                            {message.file_url && message.file_type === "image" && (
                              <img
                                src={message.file_url || "/placeholder.svg"}
                                alt="Image"
                                className="rounded-lg max-w-full max-h-64 object-cover mb-2"
                              />
                            )}
                            {message.file_url && message.file_type === "video" && (
                              <video controls className="rounded-lg max-w-full max-h-64 mb-2">
                                <source src={message.file_url} />
                              </video>
                            )}
                            {message.file_url && message.file_type === "document" && (
                              <a
                                href={message.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 underline"
                              >
                                <FileText className="w-5 h-5" />
                                {message.file_name || "Document"}
                              </a>
                            )}
                            {message.file_url && message.file_type === "audio" && (
                              <audio controls className="max-w-full">
                                <source src={message.file_url} type="audio/webm" />
                              </audio>
                            )}

                            {message.content && <p className="break-words">{message.content}</p>}

                            <p
                              className={`text-xs mt-1 ${
                                message.sender_id === currentUser.id ? "text-rose-100" : "text-rose-400"
                              }`}
                            >
                              {new Date(message.created_at).toLocaleTimeString("ru-RU", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Message Input with File Support */}
                  <div className="p-6 border-t border-rose-200">
                    <div className="flex gap-2 mb-3">
                      <Button
                        onClick={() => sendFile("image")}
                        variant="outline"
                        size="sm"
                        className="border-rose-200 hover:bg-rose-50"
                        title="Send Image"
                      >
                        <ImageIcon className="w-4 h-4 text-rose-500" />
                      </Button>
                      <Button
                        onClick={() => sendFile("video")}
                        variant="outline"
                        size="sm"
                        className="border-rose-200 hover:bg-rose-50"
                        title="Send Video"
                      >
                        <Video className="w-4 h-4 text-rose-500" />
                      </Button>
                      <Button
                        onClick={() => sendFile("document")}
                        variant="outline"
                        size="sm"
                        className="border-rose-200 hover:bg-rose-50"
                        title="Send Document"
                      >
                        <Paperclip className="w-4 h-4 text-rose-500" />
                      </Button>
                      <Button
                        onClick={isRecording ? stopRecording : startRecording}
                        variant="outline"
                        size="sm"
                        className={`border-rose-200 hover:bg-rose-50 ${isRecording ? "bg-red-100" : ""}`}
                        title="Voice Message (30s max)"
                      >
                        <Mic className={`w-4 h-4 ${isRecording ? "text-red-500 animate-pulse" : "text-rose-500"}`} />
                        {isRecording && <span className="text-xs ml-1">{recordingTime}s</span>}
                      </Button>
                    </div>
                    <div className="flex gap-3">
                      <Input
                        type="text"
                        placeholder="Write a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                        className="flex-1 bg-white/50 border-rose-200 focus:border-rose-400"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        className="bg-rose-500 hover:bg-rose-600 text-white"
                      >
                        <Send className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-rose-400">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Select a user to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
