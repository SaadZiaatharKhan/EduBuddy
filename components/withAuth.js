"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/config/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const withAuth = (WrappedComponent, allowedRoles = []) => {
  return function ProtectedComponent(props) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          try {
            // Fetch additional user data from Firestore using the user's UID.
            const userDocRef = doc(db, "users", currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            let combinedUser = currentUser;
            if (userDocSnap.exists()) {
              combinedUser = { ...currentUser, ...userDocSnap.data() };
            }
            // If allowedRoles is specified, check if the user's role is allowed.
            if (allowedRoles.length > 0 && !allowedRoles.includes(combinedUser.userType)) {
              // If not allowed, redirect based on the user's role.
              if (combinedUser.userType === "student") {
                router.push("/student");
              } else if (combinedUser.userType === "faculty") {
                router.push("/faculty");
              } else {
                // Optionally redirect to a generic unauthorized page.
                router.push("/unauthorized");
              }
              return;
            }
            setUser(combinedUser);
          } catch (error) {
            console.error("Error fetching user data:", error);
            setUser(currentUser);
          } finally {
            setLoading(false);
          }
        } else {
          router.push("/auth");
        }
      });
      return () => unsubscribe();
    }, [router, allowedRoles]);

    if (loading) return <div>Loading...</div>;

    return <WrappedComponent {...props} user={user} />;
  };
};

export default withAuth;
