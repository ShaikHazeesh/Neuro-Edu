import { ChatBot } from "@/components/ChatBot"

export default function AdminChatbot() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Admin Chatbot</h1>
          <p className="text-muted-foreground mt-2">
            Use this chatbot to assist students with common administrative queries.
          </p>
        </div>
        
        <div className="flex justify-center items-start min-h-[700px]">
          <ChatBot standalone={true} />
        </div>
      </div>
    </div>
  )
} 