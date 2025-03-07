"use client";
import React, { useState } from 'react';
import withAuth from "@/components/withAuth";
import { structure } from '@/structure';
import Image from 'next/image';

const StudentConversation = ({ user }) => {
  // Closed by default.
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          <p className="text-gray-500">Chat area (messages will appear here)...</p>
        </div>
        {/* Input Text */}
        <input
          type="text"
          placeholder="Search"
          className="p-1 m-1 w-full h-10 rounded-2xl bg-slate-300"
        />
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
        // When sidebar is open, place toggle at the right edge of the sidebar;
        // when closed, keep it visible at the left edge of the screen.
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
