import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebaseConfig";
import { signOut } from "firebase/auth";
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

import { LuPanelLeft, LuUser } from "react-icons/lu";
import { BsInfoCircleFill } from "react-icons/bs";

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [localSmashCount, setLocalSmashCount] = useState(0);
  const [timeoutId, setTimeoutId] = useState(null);
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [isInfoCardVisible, setIsInfoCardVisible] = useState(false); // State for info card visibility

  const navigate = useNavigate();

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

  const togglePanel = () => {
    setIsPanelVisible(!isPanelVisible);
  };

  const togglePopup = () => {
    setIsPopupVisible(!isPopupVisible);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const showInfoCard = () => {
    setIsInfoCardVisible(true);
  };

  const hideInfoCard = () => {
    setIsInfoCardVisible(false);
  };

  return (
    <div className="flex">
      {isPanelVisible && (
        <div className="panel h-[100vh] w-[20vw] bg-[#D6C1AE] px-[30px] overflow-auto">
          <div className="flex flex-row justify-between items-center my-4">
            <div>
              <h1 className="text-[#7c7c7c] text-[25px] mt-4 mb-4 font-[900] e">
                SMASH
              </h1>
            </div>
            <div>
              <LuPanelLeft
                size={26}
                onClick={togglePanel}
                style={{ cursor: "pointer" }}
              />
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
          <div className="w-[20vw] absolute bottom-0 left-0 right-0 flex justify-between p-4 shadow-md">
            <LuUser
              size={26}
              onClick={togglePopup}
              style={{ cursor: "pointer" }}
            />
            <BsInfoCircleFill
              size={26}
              onMouseEnter={showInfoCard}
              onMouseLeave={hideInfoCard}
              style={{ cursor: "pointer" }}
            />
          </div>
          {isInfoCardVisible && (
            <div className=" absolute bottom-12 left-4 bg-white p-2  rounded shadow-lg w-[210px]">
              <p className="text-sm">
                Smash the big button to compete on the leaderboard.
              </p>
            </div>
          )}
        </div>
      )}
      {!isPanelVisible && (
        <div className="fixed px-[14px] py-[40px] h-[100vh] bg-[#D6C1AE]">
          <LuPanelLeft
            size={26}
            onClick={togglePanel}
            style={{ cursor: "pointer" }}
          />
        </div>
      )}
      <div
        className={`fixed top-[40vh] ${
          isPanelVisible ? "left-[45vw]" : "left-[40vw]"
        }`}
      >
        <button
          onClick={addSmash}
          className="h-[160px] w-[300px] mt-4 p-2 bg-[#d6c1ae]  font-bold italic rounded-[40px] hover:bg-[#ccb9a8] text-[#7c7c7c] "
        >
          SMASH HERE
        </button>
      </div>

      {isPopupVisible && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-60">
          <div className="flex flex-col bg-[#d6c3b3] p-10 rounded-[20px] shadow-lg">
            <h2 className="h-[20vh] w-[25vw] text-xl">User Information</h2>
            {currentUser ? (
              <div>
                <p>
                  <strong>Username:</strong> {currentUser.displayName}
                </p>
                <p>
                  <strong>Email:</strong> {currentUser.email}
                </p>
                <div className="flex justify-between">
                  {" "}
                  <button
                    onClick={handleLogout}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Logout
                  </button>
                  <button
                    onClick={togglePopup}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <p>No user is signed in.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
