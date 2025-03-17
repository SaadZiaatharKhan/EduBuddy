"use client";
import React, { useState, useEffect } from "react";
import withAuth from "@/components/withAuth";
import { structure } from "@/structure";
import Image from "next/image";
import { db } from "@/firebase/firebaseClient";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

const StudentConversation = ({ user }) => {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const messagesRef = collection(
          db,
          "conversations",
          user.uid,
          "messages"
        );
        const q = query(messagesRef, orderBy("timestamp", "desc"), limit(6));
        const querySnapshot = await getDocs(q);
        const messages = [];
        querySnapshot.forEach((doc) => {
          messages.push(doc.data());
        });
        setChatMessages(messages.reverse());
      } catch (error) {
        console.error("Error fetching chat history: ", error);
      }
    };
    fetchChatHistory();
  }, [user.uid]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleBack = () => {
    if (selectedChapter) {
      setSelectedChapter(null);
    } else {
      setSelectedSubject(null);
    }
  };

  const subjectsData = structure.grade[user.grade]?.subjects || {};
  let chaptersData = {};
  if (selectedSubject) {
    const subjectObj = subjectsData[selectedSubject];
    if (subjectObj) {
      if (subjectObj.chapters) {
        chaptersData = subjectObj.chapters;
      } else {
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

  const sidebarWidth = "16rem";

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const payload = {
      subject: selectedSubject,
      chapter: selectedChapter,
      message: inputValue,
      uid: user.uid,
      grade: user.grade,
    };

    const newMessage = {
      sender: "user",
      text: inputValue,
      timestamp: serverTimestamp(),
    };
    setChatMessages((prev) => [...prev, newMessage]);
    try {
      await addDoc(
        collection(db, "conversations", user.uid, "messages"),
        newMessage
      );
    } catch (error) {
      console.error("Error saving message to Firestore: ", error);
    }

    try {
      const res = await fetch("/api/agentQuery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        let responseText = data.response;
        if (typeof responseText === "object" && responseText !== null) {
          if (
            "output" in responseText &&
            typeof responseText.output === "string"
          ) {
            responseText = responseText.output;
          } else {
            responseText = JSON.stringify(responseText);
          }
        }
        const apiMessage = {
          sender: "api",
          text: responseText,
          sources: data.sources,
          timestamp: serverTimestamp(),
        };
        setChatMessages((prev) => [...prev, apiMessage]);
        await addDoc(
          collection(db, "conversations", user.uid, "messages"),
          apiMessage
        );
      } else {
        console.error("Failed to send message to API");
      }
    } catch (err) {
      console.error("Error sending message", err);
    }
    setInputValue("");
  };

  return (
    <div className="relative flex flex-col p-4 m-4 gap-4 h-[80vh]">
      {/* Chat Area */}
      <div className="flex flex-col border-2 border-gray-300 rounded-lg p-2 h-full w-full">
        <div className="flex items-center justify-center border-b pb-2">
          <div
            className="font-bold cursor-pointer"
            onClick={() => {
              setSelectedSubject(null);
              setSelectedChapter(null);
            }}
          >
            {headerText}
          </div>
        </div>
        <div className="flex-grow p-2 overflow-y-auto">
          {chatMessages.length === 0 ? (
            <p className="text-gray-500">
              Chat area (messages will appear here)...
            </p>
          ) : (
            chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`mb-2 ${
                  msg.sender === "user" ? "text-right" : "text-left"
                }`}
              >
                <span
                  className={
                    msg.sender === "user"
                      ? "bg-blue-100 p-2 rounded"
                      : "bg-gray-100 p-2 rounded"
                  }
                >
                  {msg.text}
                </span>
                {msg.sources && (
                  <div className="text-xs text-gray-600">
                    Sources: {msg.sources.join(", ")}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Enter Your Query"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
            className="w-full border border-gray-300 p-2 rounded mb-4 pr-10"
          />
          <button
            onClick={handleSend}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 focus:outline-none"
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

      {/* Sidebar for navigation */}
      <div
        className="absolute top-0 left-0 h-full bg-slate-500 border-2 border-gray-300 rounded-r-lg overflow-y-auto transition-transform duration-300 ease-in-out"
        style={{
          width: sidebarWidth,
          transform: sidebarOpen ? "translateX(0)" : `translateX(-${sidebarWidth})`,
        }}
      >
        <div className="p-4">
          {selectedSubject && (
            <button onClick={handleBack} className="mb-4 focus:outline-none">
              <Image
                src="/buttons/left-nav.png"
                height={30}
                width={30}
                alt="Back"
              />
            </button>
          )}
          {!selectedSubject && (
            <div className="flex flex-col gap-2">
              <button
                className="p-2 rounded shadow w-full text-left bg-blue-500 text-white transition-all duration-300 ease-in-out"
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
                  className="p-2 rounded shadow w-full text-left bg-white text-black transition-all duration-300 ease-in-out"
                  onClick={() => {
                    setSelectedSubject(subject);
                    setSelectedChapter(null);
                  }}
                >
                  {subject}
                </button>
              ))}
            </div>
          )}
          {selectedSubject && (
            <div className="flex flex-col gap-2">
              <div className="p-2 font-bold text-white bg-slate-700 rounded transition-all duration-300 ease-in-out">
                {selectedSubject}
              </div>
              {Object.keys(chaptersData).map((chapterKey) => (
                <button
                  key={chapterKey}
                  className={`p-2 rounded shadow w-full text-left transition-all duration-300 ease-in-out ${
                    selectedChapter === chaptersData[chapterKey]
                      ? "bg-blue-500 text-white"
                      : "bg-white text-black"
                  }`}
                  onClick={() => setSelectedChapter(chaptersData[chapterKey])}
                >
                  {chaptersData[chapterKey]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <button
        onClick={toggleSidebar}
        className="absolute top-1/2 transform -translate-y-1/2 z-50 transition-all duration-300 ease-in-out focus:outline-none"
        style={{ left: sidebarOpen ? sidebarWidth : "0" }}
      >
        <Image
          src={
            sidebarOpen
              ? "/buttons/sidebar-left.png"
              : "/buttons/sidebar-right.png"
          }
          height={30}
          width={30}
          alt={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
        />
      </button>
    </div>
  );
};

export default withAuth(StudentConversation);
