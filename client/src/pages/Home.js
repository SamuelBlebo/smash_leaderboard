import React from "react";
import { useAuth } from "../AuthContext";
import Leaderboard from "./Leaderboard";

export default function Home() {
  const { currentUser } = useAuth();

  return (
    <div className="">
      <Leaderboard currentUser={currentUser} />
    </div>
  );
}
