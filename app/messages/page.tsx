"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { MessageSquare, Send, Search, User, X, ImageIcon, FileText, Video, Mic, ChevronDown } from "lucide-react"
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
  const [recordingStatus, setRecordingStatus] = useState<"idle" | "recording" | "processing" | "sending" | "error">(
    "idle",
  )
  const [recordingError, setRecordingError] = useState("")
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

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
        .channel(`messages-${currentUser.id}-${selectedUser.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `or(and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id}))`,
          },
          async (payload) => {
            console.log("[v0] New message received via realtime:", payload.new)
            const newMsg = payload.new as Message

            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) {
                return prev
              }
              return [...prev, newMsg]
            })

            if (newMsg.receiver_id === currentUser.id) {
              await supabase.from("messages").update({ read: true }).eq("id", newMsg.id)
            }

            setTimeout(scrollToBottom, 100)
          },
        )
        .subscribe((status) => {
          console.log("[v0] Realtime subscription status:", status)
        })

      return () => {
        console.log("[v0] Cleaning up realtime subscription")
        supabase.removeChannel(channel)
      }
    }
  }, [selectedUser, currentUser])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

    console.log("[v0] Sending message:", newMessage)

    const messageData = {
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
      content: newMessage.trim(),
    }

    const { data, error } = await supabase.from("messages").insert(messageData).select().single()

    if (!error && data) {
      console.log("[v0] Message sent successfully:", data)
      setNewMessage("")
    } else {
      console.error("[v0] Error sending message:", error)
    }
  }

  async function deleteMessage(messageId: string) {
    const { error } = await supabase.from("messages").delete().eq("id", messageId).eq("sender_id", currentUser.id)

    if (!error) {
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
    }
  }

  async function handleFileSelect(type: "image" | "video" | "document") {
    if (!fileInputRef.current) return

    const acceptTypes = {
      image: "image/*",
      video: "video/*",
      document: ".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar",
    }

    fileInputRef.current.accept = acceptTypes[type]
    fileInputRef.current.dataset.fileType = type
    fileInputRef.current.click()
  }

  async function uploadFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !selectedUser || !currentUser) return

    const fileType = event.target.dataset.fileType as "image" | "video" | "document"

    setUploadingFile(true)
    setUploadProgress(0)

    try {
      console.log("[v0] Uploading file:", file.name, file.type)

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const reader = new FileReader()
      reader.onloadend = async () => {
        const fileUrl = reader.result as string

        clearInterval(progressInterval)
        setUploadProgress(100)

        const { data, error } = await supabase
          .from("messages")
          .insert({
            sender_id: currentUser.id,
            receiver_id: selectedUser.id,
            content: fileType === "document" ? `📎 ${file.name}` : "",
            file_url: fileUrl,
            file_type: fileType,
            file_name: file.name,
          })
          .select()
          .single()

        if (error) {
          console.error("[v0] Error uploading file:", error)
          alert("Failed to send file")
        } else {
          console.log("[v0] File uploaded successfully:", data)
        }

        setUploadingFile(false)
        setUploadProgress(0)
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error("[v0] Upload error:", error)
      alert("Failed to upload file")
      setUploadingFile(false)
      setUploadProgress(0)
    }

    event.target.value = ""
  }

  async function startRecording() {
    try {
      console.log("[v0] Starting voice recording...")
      setRecordingError("")
      setRecordingStatus("recording")

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      })

      const options = { mimeType: "audio/webm;codecs=opus" }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = "audio/webm"
      }

      mediaRecorderRef.current = new MediaRecorder(stream, options)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log("[v0] Audio chunk received:", event.data.size, "bytes")
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = async () => {
        console.log("[v0] Recording stopped, processing audio...")
        setRecordingStatus("processing")

        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: options.mimeType })
          console.log("[v0] Audio blob created:", audioBlob.size, "bytes", audioBlob.type)

          const reader = new FileReader()
          reader.onloadend = async () => {
            const audioDataUrl = reader.result as string
            console.log("[v0] Audio converted to data URL, sending message...")
            setRecordingStatus("sending")

            const { data, error } = await supabase
              .from("messages")
              .insert({
                sender_id: currentUser.id,
                receiver_id: selectedUser?.id,
                content: `🎤 Голосовое сообщение (${recordingTime}s)`,
                file_url: audioDataUrl,
                file_type: "audio",
                file_name: `voice-${Date.now()}.webm`,
              })
              .select()
              .single()

            if (error) {
              console.error("[v0] Error sending audio:", error)
              setRecordingStatus("error")
              setRecordingError("Ошибка отправки")
              setTimeout(() => setRecordingStatus("idle"), 3000)
            } else {
              console.log("[v0] Audio sent successfully:", data)
              setRecordingStatus("idle")
            }
          }

          reader.onerror = () => {
            console.error("[v0] Error converting audio to data URL")
            setRecordingStatus("error")
            setRecordingError("Ошибка обработки аудио")
            setTimeout(() => setRecordingStatus("idle"), 3000)
          }

          reader.readAsDataURL(audioBlob)
        } catch (error) {
          console.error("[v0] Error processing audio:", error)
          setRecordingStatus("error")
          setRecordingError("Ошибка обработки")
          setTimeout(() => setRecordingStatus("idle"), 3000)
        } finally {
          stream.getTracks().forEach((track) => {
            track.stop()
            console.log("[v0] Media track stopped:", track.kind)
          })
        }
      }

      mediaRecorderRef.current.onerror = (event: any) => {
        console.error("[v0] MediaRecorder error:", event.error)
        setRecordingStatus("error")
        setRecordingError(
          event.error.name === "NotAllowedError" ? "Доступ к микрофону запрещён" : "Ошибка доступа к микрофону",
        )
        stream.getTracks().forEach((track) => track.stop())
        setTimeout(() => setRecordingStatus("idle"), 3000)
      }

      mediaRecorderRef.current.start(100)
      setIsRecording(true)
      setRecordingTime(0)

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 30) {
            stopRecording()
            return 30
          }
          return prev + 1
        })
      }, 1000)

      console.log("[v0] Recording started successfully")
    } catch (error: any) {
      console.error("[v0] Could not access microphone:", error)
      setRecordingStatus("error")
      setRecordingError(error.name === "NotAllowedError" ? "Доступ к микрофону запрещён" : "Ошибка доступа к микрофону")
      setTimeout(() => setRecordingStatus("idle"), 3000)
    }
  }

  function stopRecording() {
    console.log("[v0] Stopping recording...")
    if (mediaRecorderRef.current && isRecording) {
      if (mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop()
      }
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  function scrollToBottom(smooth = true) {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" })
    setShowScrollButton(false)
  }

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const element = event.currentTarget
    const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 100
    setShowScrollButton(!isNearBottom)
  }

  const getRecordingButtonClass = () => {
    if (recordingStatus === "error") return "bg-red-100 border-red-500"
    if (recordingStatus === "recording") return "bg-red-100 border-red-500 animate-pulse"
    if (recordingStatus === "processing" || recordingStatus === "sending") return "bg-yellow-100 border-yellow-500"
    return "border-rose-200 hover:bg-rose-50"
  }

  const getRecordingButtonText = () => {
    if (recordingStatus === "recording") return `${recordingTime}s`
    if (recordingStatus === "processing") return "..."
    if (recordingStatus === "sending") return "↑"
    if (recordingStatus === "error") return "!"
    return ""
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
                  <div className="flex-1 relative">
                    <ScrollArea className="h-full p-6" onScroll={handleScroll} ref={scrollAreaRef}>
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.sender_id === currentUser.id ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-2xl px-4 py-3 relative group ${
                                message.sender_id === currentUser.id
                                  ? "bg-rose-500 text-white"
                                  : "bg-white text-rose-900"
                              }`}
                            >
                              {message.sender_id === currentUser.id && (
                                <button
                                  onClick={() => deleteMessage(message.id)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Delete message"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}

                              {message.file_url && message.file_type === "image" && (
                                <img
                                  src={message.file_url || "/placeholder.svg"}
                                  alt="Image"
                                  className="rounded-lg max-w-full max-h-64 object-cover mb-2"
                                  onLoad={() => scrollToBottom(false)}
                                />
                              )}
                              {message.file_url && message.file_type === "video" && (
                                <video
                                  controls
                                  className="rounded-lg max-w-full max-h-64 mb-2"
                                  onLoadedMetadata={() => scrollToBottom(false)}
                                >
                                  <source src={message.file_url} />
                                  Your browser does not support video playback.
                                </video>
                              )}
                              {message.file_url && message.file_type === "document" && (
                                <a
                                  href={message.file_url}
                                  download={message.file_name}
                                  className="flex items-center gap-2 underline hover:no-underline"
                                  title="Download document"
                                >
                                  <FileText className="w-5 h-5" />
                                  <span className="break-words">{message.file_name || "Document"}</span>
                                </a>
                              )}
                              {message.file_url && message.file_type === "audio" && (
                                <div className="space-y-2">
                                  <audio
                                    controls
                                    className="max-w-full w-64"
                                    preload="metadata"
                                    onLoadedMetadata={() => scrollToBottom(false)}
                                  >
                                    <source src={message.file_url} type="audio/webm" />
                                    <source src={message.file_url} type="audio/mpeg" />
                                    Your browser does not support audio playback.
                                  </audio>
                                </div>
                              )}

                              {message.content && <p className="break-words whitespace-pre-wrap">{message.content}</p>}

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
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    {showScrollButton && (
                      <button
                        onClick={() => scrollToBottom()}
                        className="absolute bottom-4 right-4 bg-rose-500 text-white rounded-full p-3 shadow-lg hover:bg-rose-600 transition-all z-10 animate-bounce"
                        title="Scroll to bottom"
                      >
                        <ChevronDown className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Message Input with File Support */}
                  <div className="p-6 border-t border-rose-200">
                    {(recordingStatus !== "idle" || recordingError || uploadingFile) && (
                      <div className="mb-3 text-sm text-center">
                        {recordingStatus === "recording" && (
                          <div className="text-red-600 font-semibold flex items-center justify-center gap-2">
                            <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
                            <span className="animate-pulse">● REC</span>
                            <span className="font-mono">{recordingTime}s / 30s</span>
                          </div>
                        )}
                        {recordingStatus === "processing" && (
                          <div className="text-yellow-600 font-semibold flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                            Обработка аудио...
                          </div>
                        )}
                        {recordingStatus === "sending" && (
                          <div className="text-blue-600 font-semibold flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            Отправка...
                          </div>
                        )}
                        {recordingStatus === "error" && (
                          <div className="text-red-600 font-semibold">{recordingError}</div>
                        )}
                        {uploadingFile && (
                          <div className="text-blue-600 font-semibold flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            Загрузка файла... {uploadProgress}%
                          </div>
                        )}
                      </div>
                    )}

                    <input ref={fileInputRef} type="file" onChange={uploadFile} className="hidden" />

                    <div className="flex gap-2 mb-3">
                      <Button
                        onClick={() => handleFileSelect("image")}
                        variant="outline"
                        size="sm"
                        className="border-rose-200 hover:bg-rose-50"
                        disabled={uploadingFile}
                        title="Upload Image"
                      >
                        <ImageIcon className="w-4 h-4 text-rose-500" />
                      </Button>
                      <Button
                        onClick={() => handleFileSelect("video")}
                        variant="outline"
                        size="sm"
                        className="border-rose-200 hover:bg-rose-50"
                        disabled={uploadingFile}
                        title="Upload Video"
                      >
                        <Video className="w-4 h-4 text-rose-500" />
                      </Button>
                      <Button
                        onClick={() => handleFileSelect("document")}
                        variant="outline"
                        size="sm"
                        className="border-rose-200 hover:bg-rose-50"
                        disabled={uploadingFile}
                        title="Upload Document"
                      >
                        <FileText className="w-4 h-4 text-rose-500" />
                      </Button>
                      <Button
                        onClick={isRecording ? stopRecording : startRecording}
                        variant="outline"
                        size="sm"
                        className={`${getRecordingButtonClass()} relative overflow-hidden`}
                        disabled={uploadingFile || recordingStatus === "processing" || recordingStatus === "sending"}
                        title={isRecording ? "Stop Recording" : "Record Voice Message"}
                      >
                        <Mic
                          className={`w-4 h-4 ${recordingStatus === "recording" ? "text-red-600" : "text-rose-500"}`}
                        />
                        {getRecordingButtonText() && (
                          <span className="ml-1 font-mono text-xs">{getRecordingButtonText()}</span>
                        )}
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage()
                          }
                        }}
                        placeholder="Type a message..."
                        className="flex-1 bg-white/50 border-rose-200 focus:border-rose-400"
                        disabled={isRecording || uploadingFile}
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || isRecording || uploadingFile}
                        className="bg-rose-500 hover:bg-rose-600 text-white"
                      >
                        <Send className="w-4 h-4" />
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
