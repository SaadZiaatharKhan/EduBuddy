"use client";
import withAuth from "@/components/withAuth";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, auth } from "@/config/firebaseConfig";
import TakeTest from "@/components/student/take_test";
import StudentConversation from "@/components/student/conversation";
import Profile from "@/components/student/profile";
import History from "@/components/student/history";

function StudentPage({ user }) {
  const [openNav, setOpenNav] = useState(false);
  const [navValue, setNavValue] = useState("conversation");
  const router = useRouter();

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        router.push("/");
      })
      .catch((error) => {
        console.error("Error during sign out:", error);
      });
  };

  return (
    <div className="w-screen h-screen bg-white flex flex-col p-0 overflow-hidden">
      <div className="max-h-[20vh] relative">
        <div className="p-4 flex w-full justify-between items-center">
          <div>
            <h1 className="text-sm md:text-xl font-bold text-blue-400">
              Hello {user.firstName}
            </h1>
            {user.grade && (
              <p className="text-sm text-blue-400">Grade: {user.grade}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="bg-blue-500 hover:bg-blue-700 text-white rounded-md md:p-2 p-1">
              Enter 3D Space
            </button>
            <button
              className="bg-red-500 hover:bg-red-700 text-white rounded-md md:p-2 p-1"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
        <div
          className={`absolute top-15 p-2 m-2 bg-slate-400 text-white h-8 flex items-center md:gap-3 gap-[0.9px] rounded-sm text-[11px] md:text-base ${
            openNav ? "opacity-80" : "opacity-50"
          } transition-all duration-300 ease-in ${
            openNav ? "left-0" : "md:-left-96 -left-64"
          }`}
        >
          <button
            className={`p-1 m-1 rounded-md ${
              navValue === "takeTest" ? "bg-blue-800" : "bg-slate-400"
            }`}
            onClick={() => setNavValue("takeTest")}
          >
            Take Test
          </button>
          <button
            className={`p-1 m-1 rounded-md ${
              navValue === "conversation" ? "bg-blue-800" : "bg-slate-400"
            }`}
            onClick={() => setNavValue("conversation")}
          >
            Conversation
          </button>
          <button
            className={`p-1 m-1 rounded-md ${
              navValue === "history" ? "bg-blue-800" : "bg-slate-400"
            }`}
            onClick={() => setNavValue("history")}
          >
            History
          </button>
          <button
            className={`p-1 m-1 rounded-md ${
              navValue === "profile" ? "bg-blue-800" : "bg-slate-400"
            }`}
            onClick={() => setNavValue("profile")}
          >
            Profile
          </button>
          <button className="p-1 m-1" onClick={() => setOpenNav(!openNav)}>
            <Image
              src={`/buttons/${openNav ? "left" : "right"}-nav.png`}
              alt="navbar"
              width={20}
              height={20}
            />
          </button>
        </div>
      </div>
      <div className="max-h-[80vh] w-full">
        {navValue === "takeTest" && <TakeTest />}
        {navValue === "conversation" && <StudentConversation />}
        {navValue === "profile" && <Profile />}
        {navValue === "history" && <History />}
      </div>
    </div>
  );
}

export default withAuth(StudentPage, ["student"]);
