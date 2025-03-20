const { create } = require("zustand");

export const teachers = ["Nanami", "Naoki"];

export const useAITeacher = create((set, get) => ({
  messages: [],
  currentMessage: null,
  teacher: teachers[0],
  setTeacher: (teacher) => {
    set(() => ({
      teacher,
      messages: get().messages.map((message) => {
        message.audioPlayer = null; // New teacher, new Voice
        return message;
      }),
    }));
  },
  classroom: "default",
  setClassroom: (classroom) => {
    set(() => ({
      classroom,
    }));
  },
  loading: false,
  // Removed unused properties for EduBuddy

  // Updated askAI: now uses /agentQuery, and saves the response as an "agent" message.
  askAI: async (question, extraPayload = {}) => {
    if (!question) return;
    
    // Create and store the user's message.
    const userMessage = {
      sender: "user",
      text: question,
      id: get().messages.length,
    };
    set((state) => ({
      messages: [...state.messages, userMessage],
      loading: true,
    }));
    
    try {
      const res = await fetch("/api/agentQuery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          ...extraPayload,
        }),
      });
      if (!res.ok) {
        throw new Error("API Error");
      }
      const data = await res.json();
      const agentResponse = data.response;
      
      // Create a new message for the agent response.
      const agentMessage = {
        sender: "agent",
        text:
          typeof agentResponse === "string"
            ? agentResponse
            : JSON.stringify(agentResponse),
        sources: data.sources,
        id: get().messages.length,
      };
      
      set((state) => ({
        messages: [...state.messages, agentMessage],
        loading: false,
        currentMessage: agentMessage,
      }));
      
      get().playMessage(agentMessage);
    } catch (error) {
      console.error("Error calling agentQuery", error);
      set(() => ({ loading: false }));
    }
  },

  // Updated playMessage: uses /api/tts with the agent message's text.
  playMessage: async (message) => {
    set(() => ({
      currentMessage: message,
    }));

    if (!message.audioPlayer) {
      set(() => ({
        loading: true,
      }));
      // Get TTS using the text from message.text
      const audioRes = await fetch(
        `/api/tts?text=${encodeURIComponent(message.text)}`
      );
      const audio = await audioRes.blob();
      const audioUrl = URL.createObjectURL(audio);
      const audioPlayer = new Audio(audioUrl);

      message.audioPlayer = audioPlayer;
      message.audioPlayer.onended = () => {
        set(() => ({
          currentMessage: null,
        }));
      };
      set(() => ({
        loading: false,
        messages: get().messages.map((m) =>
          m.id === message.id ? message : m
        ),
      }));
    }

    message.audioPlayer.currentTime = 0;
    message.audioPlayer.play();
  },
  stopMessage: (message) => {
    if (message.audioPlayer) {
      message.audioPlayer.pause();
    }
    set(() => ({
      currentMessage: null,
    }));
  },
}));
