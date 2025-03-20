import { useAITeacher } from "@/hooks/useAITeacher";
import { useEffect, useRef } from "react";

export const MessagesList = () => {
  const messages = useAITeacher((state) => state.messages);
  const container = useRef();

  useEffect(() => {
    container.current.scrollTo({
      top: container.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  // Filter for agent (EduBuddy) messages
  const agentMessages = messages.filter((msg) => msg.sender === "agent");
  const latestAgentMessage = agentMessages[agentMessages.length - 1];

  return (
    <div
      className="w-full h-full p-8 overflow-y-auto flex flex-col justify-center items-center bg-transparent opacity-80"
      ref={container}
    >
      {latestAgentMessage ? (
        <div className="text-center">
          <h2 className="text-6xl font-bold text-white/90 italic">
            {latestAgentMessage.text}
          </h2>
          {latestAgentMessage.sources && latestAgentMessage.sources.length > 0 && (
            <div className="text-xs text-gray-300 mt-2">
              <strong>Sources:</strong> {latestAgentMessage.sources.join(", ")}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center">
          <h2 className="text-8xl font-bold text-white/90 italic">
            EduBuddy
            <br />
            Empowering Learning Experiences
          </h2>
        </div>
      )}
    </div>
  );
};
