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
    const updatedUsers = users.map((user) => {
      if (user.id === currentUser.uid) {
        return { ...user, smashes: user.smashes + 1 };
      }
      return user;
    });
    setUsers(updatedUsers);

    // Update local count to send to backend
    setLocalSmashCount(localSmashCount + 1);

    // Clear previous timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout for backend update
    const id = setTimeout(() => {
      updateBackend(localSmashCount + 1); // Pass the current local count to updateBackend
      setLocalSmashCount(0); // Reset locsal count after sending to backend
    }, 1000); // Adjust timeout as needed (e.g., 2000ms = 2 seconds)
    setTimeoutId(id);
  };

  const updateBackend = async (count) => {
    const userRef = doc(db, "users", currentUser.uid);

    try {
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) {
          transaction.set(userRef, { smashes: count });
        } else {
          const newSmashes = userDoc.data().smashes + count;
          transaction.update(userRef, { smashes: newSmashes });
        }
      });
    } catch (e) {
      // Handle transaction failure
      console.error("Transaction failed", e);
      // Optionally, you can handle rollback or retry logic here
    }
  };

  return (
    <div>
      <h1>Leaderboard</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.id}: {user.smashes}
          </li>
        ))}
      </ul>
      <button onClick={addSmash}>Add Smash</button>
    </div>
  );
};

export default Leaderboard;
