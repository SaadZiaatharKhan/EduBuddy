"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth, db } from "@/config/firebaseConfig";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true); // Login mode by default.
  // Fields used only in Create Account mode.
  const [userType, setUserType] = useState("student"); // "student" or "faculty"
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [grade, setGrade] = useState("1"); // default grade for students

  const router = useRouter();

  const handleGoogleAuth = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (isLogin) {
        // In Login mode, check if extra data exists.
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
          alert("Account not registered. Please create an account first.");
          return;
        }
        alert("Authenticated successfully!");
        const userData = userDocSnap.data();
        if (userData.userType === "student") {
          router.push("/student");
        } else if (userData.userType === "faculty") {
          router.push("/faculty");
        } else {
          router.push("/dashboard"); // Fallback route if needed.
        }
      } else {
        // In Create Account mode, ensure the Google account's email matches the provided email.
        if (user.email !== email) {
          alert("Google account email does not match the provided email.");
          return;
        }
        // Check if a user document already exists for safety.
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          alert("Account already exists. Please login.");
          return;
        }
        // Prepare the user data. Include 'grade' only for students.
        const userData = {
          firstName,
          lastName,
          email,
          userType,
          ...(userType === "student" && { grade }),
          createdAt: new Date(),
        };
        // Save the new user details using the UID as the document ID.
        await setDoc(userDocRef, userData);
        alert("Account created successfully!");
        if (userData.userType === "student") {
          router.push("/student");
        } else if (userData.userType === "faculty") {
          router.push("/faculty");
        } else {
          router.push("/dashboard"); // Fallback route.
        }
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md bg-gray-800 text-white shadow-lg p-6 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold">
            {isLogin ? "Login" : "Create Account"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* In Create Account mode, show additional fields */}
          {!isLogin && (
            <>
              <Input
                type="text"
                placeholder="First Name"
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-blue-500"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <Input
                type="text"
                placeholder="Last Name"
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-blue-500"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="userType"
                    value="student"
                    checked={userType === "student"}
                    onChange={() => setUserType("student")}
                    className="mr-2"
                  />
                  Student
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="userType"
                    value="faculty"
                    checked={userType === "faculty"}
                    onChange={() => setUserType("faculty")}
                    className="mr-2"
                  />
                  Faculty
                </label>
              </div>
              {userType === "student" && (
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-blue-500"
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Grade {i + 1}
                    </option>
                  ))}
                </select>
              )}
              <Input
                type="email"
                placeholder="Email"
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </>
          )}
          {/* In Login mode, show a brief message */}
          {isLogin && (
            <p className="text-center text-sm text-gray-300">
              Login with your Google account.
            </p>
          )}
          <Button
            className="w-full bg-red-600 hover:bg-red-700 py-2 text-lg mt-2"
            onClick={handleGoogleAuth}
          >
            {isLogin ? "Login with Google" : "Create Account with Google"}
          </Button>
          <p className="text-center text-sm mt-2">
            {isLogin
              ? "Don't have an account?"
              : "Already have an account?"}{" "}
            <span
              className="text-blue-400 cursor-pointer hover:underline"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Create Account" : "Login"}
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
