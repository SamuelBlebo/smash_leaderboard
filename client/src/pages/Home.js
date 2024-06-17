import React from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useAuth } from "../AuthContext";

import Leaderboard from "./Leaderboard";

export default function Home() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <div>
      <div>Hello, I'm Home</div>
      {currentUser && (
        <p>Welcome, {currentUser.displayName || currentUser.email}</p>
      )}
      <button
        onClick={handleLogout}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
      >
        Logout
      </button>

      <Leaderboard />
    </div>
  );
}
