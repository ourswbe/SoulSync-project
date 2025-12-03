"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import {
  MessageSquare,
  Send,
  Search,
  User,
  X,
  ImageIcon,
  FileText,
  Video,
  Mic,
  ChevronDown,
  ArrowLeft,
} from "lucide-react"
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
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const isUserScrollingRef = useRef(false)

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
        .channel(`chat:${currentUser.id}:${selectedUser.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
          },
          async (payload) => {
            const newMsg = payload.new as Message

            if (
              (newMsg.sender_id === currentUser.id && newMsg.receiver_id === selectedUser.id) ||
              (newMsg.sender_id === selectedUser.id && newMsg.receiver_id === currentUser.id)
            ) {
              console.log("[v0] ✅ Новое сообщение получено мгновенно:", newMsg)

              setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) {
                  return prev
                }
                return [...prev, newMsg]
              })

              if (newMsg.receiver_id === currentUser.id) {
                await supabase.from("messages").update({ read: true }).eq("id", newMsg.id)
              }

              if (shouldAutoScroll && !isUserScrollingRef.current) {
                setTimeout(() => scrollToBottom(), 100)
              }
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "messages",
          },
          (payload) => {
            const deletedId = payload.old.id
            console.log("[v0] 🗑️ Сообщение удалено:", deletedId)

            setMessages((prev) => prev.filter((m) => m.id !== deletedId))
          },
        )
        .subscribe((status) => {
          console.log("[v0] 🔌 WebSocket статус:", status)
          if (status === "SUBSCRIBED") {
            console.log("[v0] ✅ Realtime подключен успешно (INSERT + DELETE)")
          }
        })

      return () => {
        console.log("[v0] 🔌 Отключение WebSocket")
        supabase.removeChannel(channel)
      }
    }
  }, [selectedUser, currentUser, shouldAutoScroll])

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
      setTimeout(() => scrollToBottom(), 100)
    } else {
      console.error("[v0] Error sending message:", error)
    }
  }

  async function deleteMessage(messageId: string) {
    if (!confirm("Удалить сообщение у всех?")) return

    const { error } = await supabase.from("messages").delete().eq("id", messageId).eq("sender_id", currentUser.id)

    if (error) {
      console.error("[v0] Ошибка удаления:", error)
      alert("Не удалось удалить сообщение")
    } else {
      console.log("[v0] ✅ Сообщение удалено успешно")
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
      console.log("[v0] 🎤 Начало записи голосового сообщения...")
      setRecordingError("")
      setRecordingStatus("recording")

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      })

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm"

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType })
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = async () => {
        console.log("[v0] ⏸️ Запись остановлена, обработка...")
        setRecordingStatus("processing")

        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
          console.log("[v0] 📦 Аудио blob:", audioBlob.size, "bytes")

          const reader = new FileReader()
          reader.onloadend = async () => {
            const audioDataUrl = reader.result as string
            console.log("[v0] 📤 Отправка голосового сообщения...")
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
              console.error("[v0] ❌ Ошибка отправки:", error)
              setRecordingStatus("error")
              setRecordingError("Не удалось отправить")
            } else {
              console.log("[v0] ✅ Голосовое сообщение отправлено успешно")
              setRecordingStatus("idle")
            }

            setTimeout(() => {
              if (recordingStatus === "error") setRecordingStatus("idle")
            }, 3000)
          }

          reader.readAsDataURL(audioBlob)
        } catch (error) {
          console.error("[v0] ❌ Ошибка обработки:", error)
          setRecordingStatus("error")
          setRecordingError("Ошибка обработки")
        } finally {
          stream.getTracks().forEach((track) => track.stop())
        }
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

      console.log("[v0] ✅ Запись началась")
    } catch (error: any) {
      console.error("[v0] ❌ Ошибка доступа к микрофону:", error)
      setRecordingStatus("error")
      setRecordingError(error.name === "NotAllowedError" ? "Доступ запрещён" : "Ошибка микрофона")
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
    setShouldAutoScroll(true)
    isUserScrollingRef.current = false
  }

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const element = event.currentTarget
    const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 100

    setShowScrollButton(!isNearBottom)
    setShouldAutoScroll(isNearBottom)

    if (!isNearBottom) {
      isUserScrollingRef.current = true
    }
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6 flex items-center gap-4">
          <Button
            onClick={() => router.push("/home")}
            variant="outline"
            className="flex items-center gap-2 border-rose-300 hover:bg-rose-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Button>
          <h1 className="text-3xl font-bold text-rose-900 flex items-center gap-3">
            <MessageSquare className="w-8 h-8" />
            Chat
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
          <div className="bg-white rounded-2xl shadow-lg border border-rose-100 p-4 flex flex-col">
            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-rose-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 border-rose-200 focus:border-rose-400 text-sm"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-1">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full p-3 rounded-xl text-left transition-all ${
                      selectedUser?.id === user.id
                        ? "bg-rose-500 text-white shadow-md"
                        : "hover:bg-rose-50 text-rose-900"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url || "/placeholder.svg"}
                          alt={user.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-rose-200 flex items-center justify-center">
                          <User className="w-5 h-5 text-rose-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {user.first_name} {user.last_name}
                        </p>
                        <p
                          className={`text-xs truncate ${
                            selectedUser?.id === user.id ? "text-rose-100" : "text-rose-500"
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

          <div
            className="md:col-span-2 bg-white rounded-2xl shadow-lg border border-rose-100 flex flex-col overflow-y-auto"
            onScroll={handleScroll}
          >
            {selectedUser ? (
              <>
                <div className="p-4 border-b border-rose-100 bg-gradient-to-r from-rose-50 to-pink-50">
                  <div className="flex items-center gap-3">
                    {selectedUser.avatar_url ? (
                      <img
                        src={selectedUser.avatar_url || "/placeholder.svg"}
                        alt={selectedUser.username}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-rose-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-rose-200 flex items-center justify-center ring-2 ring-rose-300">
                        <User className="w-6 h-6 text-rose-600" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-bold text-rose-900">
                        {selectedUser.first_name} {selectedUser.last_name}
                      </h2>
                      <p className="text-xs text-rose-500">@{selectedUser.username}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === currentUser.id ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 relative group shadow-sm ${
                          message.sender_id === currentUser.id
                            ? "bg-rose-500 text-white"
                            : "bg-white text-rose-900 border border-rose-100"
                        }`}
                      >
                        {message.sender_id === currentUser.id && (
                          <button
                            onClick={() => deleteMessage(message.id)}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"
                            title="Удалить у всех"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}

                        {message.file_url && message.file_type === "image" && (
                          <img
                            src={message.file_url || "/placeholder.svg"}
                            alt="Image"
                            className="rounded-xl max-w-xs mb-2"
                            onLoad={() => {
                              if (shouldAutoScroll) scrollToBottom(false)
                            }}
                          />
                        )}

                        {message.file_url && message.file_type === "video" && (
                          <video
                            src={message.file_url}
                            controls
                            className="rounded-xl max-w-xs mb-2"
                            onLoadedMetadata={() => {
                              if (shouldAutoScroll) scrollToBottom(false)
                            }}
                          />
                        )}

                        {message.file_url && message.file_type === "audio" && (
                          <audio
                            src={message.file_url}
                            controls
                            className="max-w-xs"
                            onLoadedMetadata={() => {
                              if (shouldAutoScroll) scrollToBottom(false)
                            }}
                          />
                        )}

                        {message.file_url && message.file_type === "document" && (
                          <a
                            href={message.file_url}
                            download={message.file_name}
                            className="flex items-center gap-2 text-sm underline"
                          >
                            <FileText className="w-4 h-4" />
                            {message.file_name}
                          </a>
                        )}

                        {message.content && (
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        )}

                        <p
                          className={`text-[10px] mt-1 ${
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

                {showScrollButton && (
                  <button
                    onClick={() => scrollToBottom()}
                    className="absolute right-8 bottom-24 bg-rose-500 text-white p-3 rounded-full shadow-lg hover:bg-rose-600 transition-all z-10 animate-bounce"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                )}

                <div className="p-4 border-t border-rose-100 bg-white">
                  {recordingStatus !== "idle" && (
                    <div className="mb-3 p-2 rounded-lg bg-rose-50 border border-rose-200">
                      <div className="flex items-center gap-2 text-sm">
                        {recordingStatus === "recording" && (
                          <>
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-rose-900 font-medium">Запись... {recordingTime}s</span>
                            <div className="flex-1 flex gap-1 items-center">
                              {[...Array(5)].map((_, i) => (
                                <div
                                  key={i}
                                  className="w-1 bg-rose-400 rounded-full animate-pulse"
                                  style={{
                                    height: `${Math.random() * 16 + 8}px`,
                                    animationDelay: `${i * 0.1}s`,
                                  }}
                                />
                              ))}
                            </div>
                          </>
                        )}
                        {recordingStatus === "processing" && (
                          <>
                            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                            <span className="text-rose-900">Обработка аудио...</span>
                          </>
                        )}
                        {recordingStatus === "sending" && (
                          <>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            <span className="text-rose-900">Отправка...</span>
                          </>
                        )}
                        {recordingStatus === "error" && (
                          <>
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                            <span className="text-red-600">{recordingError}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {uploadingFile && (
                    <div className="mb-3 p-2 rounded-lg bg-rose-50 border border-rose-200">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        <span className="text-rose-900">Загрузка файла... {uploadProgress}%</span>
                        <div className="flex-1 bg-rose-200 rounded-full h-2">
                          <div
                            className="bg-rose-500 h-2 rounded-full transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input ref={fileInputRef} type="file" className="hidden" onChange={uploadFile} />

                    <Button
                      onClick={() => handleFileSelect("image")}
                      variant="outline"
                      size="icon"
                      className="border-rose-200 hover:bg-rose-50 hover:border-rose-300"
                      title="Отправить фото"
                    >
                      <ImageIcon className="w-5 h-5 text-rose-500" />
                    </Button>

                    <Button
                      onClick={() => handleFileSelect("video")}
                      variant="outline"
                      size="icon"
                      className="border-rose-200 hover:bg-rose-50 hover:border-rose-300"
                      title="Отправить видео"
                    >
                      <Video className="w-5 h-5 text-rose-500" />
                    </Button>

                    <Button
                      onClick={() => handleFileSelect("document")}
                      variant="outline"
                      size="icon"
                      className="border-rose-200 hover:bg-rose-50 hover:border-rose-300"
                      title="Отправить файл"
                    >
                      <FileText className="w-5 h-5 text-rose-500" />
                    </Button>

                    <Input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      placeholder="Написать сообщение..."
                      className="flex-1 border-rose-200 focus:border-rose-400"
                      disabled={uploadingFile || recordingStatus !== "idle"}
                    />

                    <Button
                      onMouseDown={startRecording}
                      onMouseUp={stopRecording}
                      onMouseLeave={stopRecording}
                      onTouchStart={startRecording}
                      onTouchEnd={stopRecording}
                      variant="outline"
                      size="icon"
                      className={`border-2 transition-all ${getRecordingButtonClass()}`}
                      disabled={uploadingFile}
                      title="Удерживайте для записи (макс 30с)"
                    >
                      <Mic
                        className={`w-5 h-5 ${recordingStatus === "recording" ? "text-red-600" : "text-rose-500"}`}
                      />
                      {getRecordingButtonText() && (
                        <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {getRecordingButtonText()}
                        </span>
                      )}
                    </Button>

                    <Button
                      onClick={sendMessage}
                      className="bg-rose-500 hover:bg-rose-600 text-white"
                      disabled={!newMessage.trim() || uploadingFile || recordingStatus !== "idle"}
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
                  <p>Выберите пользователя для начала чата</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
