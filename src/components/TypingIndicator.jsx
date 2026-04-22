function TypingIndicator() {
  return (
    <div className="animate-message-in flex justify-start">
      <div className="bg-white shadow-md px-4 py-3 rounded-2xl max-w-[65%]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#A7C7E7] [animation-delay:-0.2s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#FFB6C1] [animation-delay:-0.1s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#A7C7E7]" />
        </div>
      </div>
    </div>
  )
}

export default TypingIndicator
