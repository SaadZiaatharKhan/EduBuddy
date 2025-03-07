"use client";
import withAuth from "@/components/withAuth";

function FacultyPage({ user }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-2">Hello {user.firstName}</h1>
    </div>
  );
}

export default withAuth(FacultyPage, ["faculty"]);
