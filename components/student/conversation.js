"use client";
import React, { useState, useEffect, useRef } from "react";
import withAuth from "@/components/withAuth";
import { structure } from "@/structure";
import Image from "next/image";
import { db } from "@/firebase/firebaseClient";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

const StudentConversation = ({ user }) => {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // false = collapsed, true = open
  const [inputValue, setInputValue] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // Subscribe to real-time chat history updates from Firestore.
  useEffect(() => {
    if (!user || !user.uid) return;

    const messagesRef = collection(db, "conversations", user.uid, "messages");
    // Create a query ordered by timestamp.
    const q = query(messagesRef, orderBy("timestamp", "desc"), limit(20));
    
    // Subscribe to real-time updates.
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages = [];
      querySnapshot.forEach((doc) => {
        messages.push(doc.data());
      });
      // Reverse to show messages in chronological order.
      setChatMessages(messages.reverse());
    }, (error) => {
      console.error("Error fetching chat history:", error);
    });

    // Clean up the subscription on unmount.
    return () => unsubscribe();
  }, [user]);

  // Auto-scroll to bottom when chatMessages update.
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const handleBack = () => {
    if (selectedChapter) {
      setSelectedChapter(null);
    } else {
      setSelectedSubject(null);
    }
  };

  // Extract subjects and chapters from the structure.
  const subjectsData = structure.grade[user?.grade]?.subjects || {};
  let chaptersData = {};
  if (selectedSubject) {
    const subjectObj = subjectsData[selectedSubject];
    if (subjectObj) {
      if (subjectObj.chapters) {
        chaptersData = subjectObj.chapters;
      } else {
        // Merge nested chapters if necessary.
        Object.keys(subjectObj).forEach((subKey) => {
          if (subjectObj[subKey]?.chapters) {
            chaptersData = { ...chaptersData, ...subjectObj[subKey].chapters };
          }
        });
      }
    }
  }

  let headerText = "Generalized";
  if (selectedSubject) {
    headerText = selectedSubject;
    if (selectedChapter) {
      headerText = `${selectedSubject} > ${selectedChapter}`;
    }
  }

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    if (!user || !user.uid) return;

    const payload = {
      subject: selectedSubject,
      chapter: selectedChapter,
      message: inputValue,
      uid: user.uid,
      grade: user.grade,
    };

    // Create and display the user's message.
    const newMessage = {
      sender: "user",
      text: inputValue,
      timestamp: serverTimestamp(),
    };
    // Optimistically update the UI.
    setChatMessages((prev) => [...prev, newMessage]);

    try {
      await addDoc(collection(db, "conversations", user.uid, "messages"), newMessage);
    } catch (error) {
      console.error("Error saving message to Firestore:", error);
    }

    // Send the query to your API.
    try {
      const res = await fetch("/api/agentQuery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        let responseText = data.response;

        // Convert objects to string if necessary.
        if (typeof responseText === "object" && responseText !== null) {
          responseText =
            responseText.output && typeof responseText.output === "string"
              ? responseText.output
              : JSON.stringify(responseText);
        }
        const apiMessage = {
          sender: "api",
          text: typeof responseText === "string" ? responseText : JSON.stringify(responseText),
          sources: data.sources,
          timestamp: serverTimestamp(),
        };
        // Update the UI with the agent's response.
        setChatMessages((prev) => [...prev, apiMessage]);
        await addDoc(collection(db, "conversations", user.uid, "messages"), apiMessage);
      } else {
        console.error("Failed to send message to API");
      }
    } catch (err) {
      console.error("Error sending message", err);
    }
    setInputValue("");
  };

  return (
    <div className="flex h-[85vh] overflow-hidden">
      {/* Sidebar */}
      <div
        className={`
          bg-gray-800 text-white border-r border-gray-300 overflow-y-auto 
          transition-all duration-300 ease-in-out p-4
          ${sidebarOpen ? "w-64" : "w-0"}
        `}
        style={{ minWidth: sidebarOpen ? "16rem" : "0" }}
      >
        {sidebarOpen && (
          <div className="flex flex-col gap-2">
            {selectedSubject && (
              <button
                onClick={handleBack}
                className="mb-2 focus:outline-none flex items-center bg-gray-700 px-3 py-2 rounded hover:bg-gray-600"
              >
                <Image
                  src="/buttons/left-nav.png"
                  height={20}
                  width={20}
                  alt="Back"
                  className="mr-2"
                />
                <span>Back</span>
              </button>
            )}
            {!selectedSubject && (
              <>
                <button
                  className="py-2 px-3 rounded bg-blue-600 hover:bg-blue-500 transition-all w-full text-left"
                  onClick={() => {
                    setSelectedSubject(null);
                    setSelectedChapter(null);
                  }}
                >
                  Generalized
                </button>
                {Object.keys(subjectsData).map((subject) => (
                  <button
                    key={subject}
                    className="py-2 px-3 rounded bg-gray-700 hover:bg-gray-600 transition-all w-full text-left"
                    onClick={() => {
                      setSelectedSubject(subject);
                      setSelectedChapter(null);
                    }}
                  >
                    {subject}
                  </button>
                ))}
              </>
            )}
            {selectedSubject && (
              <>
                <div className="p-2 font-bold text-white bg-gray-900 rounded">
                  {selectedSubject}
                </div>
                {Object.keys(chaptersData).map((chapterKey) => (
                  <button
                    key={chapterKey}
                    className={`py-2 px-3 rounded transition-all w-full text-left ${
                      selectedChapter === chaptersData[chapterKey]
                        ? "bg-blue-500 hover:bg-blue-400"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                    onClick={() => setSelectedChapter(chaptersData[chapterKey])}
                  >
                    {chaptersData[chapterKey]}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Main Chat Section */}
      <div className="flex flex-col flex-1 border border-gray-300 rounded-lg m-4 relative">
        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-3 left-4 bg-gray-700 text-white px-3 py-1 rounded 
                     hover:bg-gray-600 transition-colors z-10"
        >
          {sidebarOpen ? "Hide Subjects and Chapters" : "Show Subjects and Chapters"}
        </button>

        {/* Header */}
        <div className="flex items-center justify-center border-b py-2 bg-gray-100 rounded-t-lg">
          <div
            className="font-bold text-lg cursor-pointer"
            onClick={() => {
              setSelectedSubject(null);
              setSelectedChapter(null);
            }}
          >
            {headerText}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-grow p-4 overflow-y-auto bg-white">
          {chatMessages.length === 0 ? (
            <p className="text-gray-500">Chat area (messages will appear here)...</p>
          ) : (
            chatMessages.map((msg, index) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={index}
                  className={`mb-4 flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`rounded-xl p-3 max-w-[70%] shadow ${
                      isUser ? "bg-blue-100 text-right" : "bg-gray-100 text-left"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">
                      {typeof msg.text === "string" ? msg.text : JSON.stringify(msg.text)}
                    </p>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="text-xs text-gray-500 mt-2">
                        <strong>Sources:</strong> {msg.sources.join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {/* Dummy div to automatically scroll to bottom */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-300 p-3 bg-gray-50 rounded-b-lg">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Enter your query..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="w-full border border-gray-300 rounded-full py-2 px-4 pr-12 
                         focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={handleSend}
              className="absolute right-3 text-blue-600 hover:text-blue-800 focus:outline-none"
            >
              <Image
                src="/buttons/send-up-arrow.png"
                height={25}
                width={25}
                alt="Send"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withAuth(StudentConversation);
