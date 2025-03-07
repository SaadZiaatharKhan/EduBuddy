"use client";
import React, { useState } from 'react';
import withAuth from "@/components/withAuth";
import { structure } from '@/structure';
import Image from 'next/image';

const StudentConversation = ({ user }) => {
  // Sidebar and selection states.
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Input and chat message states.
  const [inputValue, setInputValue] = useState("");
  const [chatMessages, setChatMessages] = useState([]);

  // Toggle sidebar open/closed without affecting chat area.
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Back arrow logic inside the sidebar.
  const handleBack = () => {
    if (selectedChapter) {
      setSelectedChapter(null);
    } else {
      setSelectedSubject(null);
    }
  };

  // Get subjects for the student's grade.
  const subjectsData = structure.grade[user.grade]?.subjects || {};

  // Get chapters for the selected subject.
  let chaptersData = {};
  if (selectedSubject) {
    const subjectObj = subjectsData[selectedSubject];
    if (subjectObj) {
      if (subjectObj.chapters) {
        chaptersData = subjectObj.chapters;
      } else {
        // Merge nested subcategories.
        Object.keys(subjectObj).forEach((subKey) => {
          if (subjectObj[subKey]?.chapters) {
            chaptersData = { ...chaptersData, ...subjectObj[subKey].chapters };
          }
        });
      }
    }
  }

  // Determine the header text for the chat area.
  let headerText = "Generalized";
  if (selectedSubject) {
    headerText = selectedSubject;
    if (selectedChapter) {
      headerText = `${selectedSubject} > ${selectedChapter}`;
    }
  }

  // Sidebar width (using 16rem for default and md can be adjusted if needed)
  const sidebarWidth = "16rem";

  // Function to send the message input to the API.
  const handleSend = async () => {
    if (!inputValue.trim()) return;

    // Create payload with selected subject, chapter, and input message.
    const payload = {
      subject: selectedSubject,
      chapter: selectedChapter,
      message: inputValue,
    };

    // Immediately add the user message to the chat area.
    setChatMessages(prev => [...prev, { sender: "user", text: inputValue }]);

    try {
      const res = await fetch('/api/studentConversation', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        const data = await res.json();
        // If the API returns a response message, add it to the chat.
        if (data.response) {
          setChatMessages(prev => [...prev, { sender: "api", text: data.response }]);
        }
      } else {
        console.error("Failed to send message to API");
      }
    } catch (err) {
      console.error("Error sending message", err);
    }
    // Clear input field after sending.
    setInputValue("");
  };

  return (
    <div className="relative flex flex-col p-4 m-4 gap-4 h-[80vh]">
      {/* CHAT AREA: remains full-sized */}
      <div className="flex flex-col border-2 border-gray-300 rounded-lg p-2 h-full w-full">
        {/* Chat Header */}
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
        {/* Chat Messages Area */}
        <div className="flex-grow p-2 overflow-y-auto">
          {chatMessages.length === 0 ? (
            <p className="text-gray-500">Chat area (messages will appear here)...</p>
          ) : (
            chatMessages.map((msg, index) => (
              <div key={index} className={`mb-2 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                <span className={msg.sender === "user" ? "bg-blue-100 p-2 rounded" : "bg-gray-100 p-2 rounded"}>
                  {msg.text}
                </span>
              </div>
            ))
          )}
        </div>
        {/* Input Area */}
        <div className="relative">
          <input
            type="text"
            placeholder="Enter Your Query"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
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

      {/* SIDEBAR: Navigation for Subjects & Chapters */}
      <div 
        className="absolute top-0 left-0 h-full bg-slate-500 border-2 border-gray-300 rounded-r-lg overflow-y-auto transition-transform duration-300 ease-in-out"
        style={{
          width: sidebarWidth,
          transform: sidebarOpen ? "translateX(0)" : `translateX(-${sidebarWidth})`,
        }}
      >
        <div className="p-4">
          {/* Back arrow appears when a subject is selected */}
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
          {/* Sidebar Content */}
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

      {/* TOGGLE BUTTON: Attached outside the sidebar */}
      <button
        onClick={toggleSidebar}
        className="absolute top-1/2 transform -translate-y-1/2 z-50 transition-all duration-300 ease-in-out focus:outline-none"
        style={{ left: sidebarOpen ? sidebarWidth : "0" }}
      >
        <Image
          src={sidebarOpen ? "/buttons/sidebar-left.png" : "/buttons/sidebar-right.png"}
          height={30}
          width={30}
          alt={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
        />
      </button>
    </div>
  );
};

export default withAuth(StudentConversation);
