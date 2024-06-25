import React, { useEffect, useState } from "react";
import { db, auth } from "../firebaseConfig";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  runTransaction,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import { LuPanelLeftClose } from "react-icons/lu";

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [localSmashCount, setLocalSmashCount] = useState(0);
  const [timeoutId, setTimeoutId] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "users"),
      orderBy("smashes", "desc"),
      limit(10)
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const leaderboardData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("Leaderboard Data: ", leaderboardData); // Log the fetched data
      setUsers(leaderboardData);
    });

    return () => unsubscribe();
  }, []);

  const addSmash = async () => {
    if (!currentUser) {
      console.log("No user is signed in.");
      return;
    }

    // Optimistically update the frontend
    let updatedUsers = users.map((user) => {
      if (user.id === currentUser.uid) {
        return { ...user, smashes: user.smashes + 1 };
      }
      return user;
    });

    // Sort users by smashes in descending order
    updatedUsers = updatedUsers.sort((a, b) => b.smashes - a.smashes);

    setUsers(updatedUsers);

    // Update local count to send to backend
    setLocalSmashCount(localSmashCount + 1);

    // Clear previous timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout for backend update
    const id = setTimeout(() => {
      updateBackend(localSmashCount + 1, currentUser.displayName); // Pass the current local count and displayName to updateBackend
      setLocalSmashCount(0); // Reset local count after sending to backend
    }, 1500); // Adjust timeout as needed (e.g., 2000ms = 2 seconds)
    setTimeoutId(id);
  };

  const updateBackend = async (count, displayName) => {
    const userRef = doc(db, "users", currentUser.uid);

    try {
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) {
          transaction.set(userRef, {
            smashes: count,
            displayName: displayName,
          });
        } else {
          const newSmashes = userDoc.data().smashes + count;
          transaction.update(userRef, {
            smashes: newSmashes,
            displayName: displayName,
          });
        }
      });
    } catch (e) {
      // Handle transaction failure
      console.error("Transaction failed", e);
      // Optionally, you can handle rollback or retry logic here
    }
  };

  return (
    <div className="flex">
      <div className="h-[100vh] w-[20vw] bg-[#D6C1AE] px-[30px] overflow-auto">
        <div className="flex flex-row justify-between items-center my-4">
          <div>
            <h1 className="text-white mt-4 mb-4">SMASH</h1>
          </div>
          <div>
            <LuPanelLeftClose size={26} />
          </div>
        </div>

        <div className="my-16">
          <ul className="space-y-2 ">
            {users.map((user) => (
              <li
                key={user.id}
                className="text-[#202020] bg-[#cab39f]  p-[4px] rounded-md flex justify-between"
              >
                <div className="ml-[5px]">
                  @{user.displayName || "Unknown User"}
                </div>
                <div className="mr-[10px]">{user.smashes}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="fixed top-[40vh] left-[55vw]">
        <button
          onClick={addSmash}
          className=" h-[160px] w-[300px] mt-4 p-2 bg-[#d6c1ae] text-white font-bold rounded-[40px] hover:bg-[#ccb9a8] "
        >
          SMASH HERE
        </button>
      </div>
    </div>
  );
};

export default Leaderboard;
