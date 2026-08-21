 import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import heroImg from "./assets/hero.png";

import Chat from "./chat";
import socket from "./socket";

import "./App.css";

function App() {
  const [currentUserId, setCurrentUserId] = useState(1);
  const [receiverId, setReceiverId] = useState(2);
  const [count, setCount] = useState(0);

  // ==============================
  // Change logged-in user
  // ==============================

  const handleUserChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newUserId = Number(event.target.value);

    setCurrentUserId(newUserId);

    // If receiver becomes the same as current user,
    // automatically choose another user.
    if (newUserId === receiverId) {
      if (newUserId === 1) {
        setReceiverId(2);
      } else {
        setReceiverId(1);
      }
    }
  };

  // ==============================
  // Change receiver
  // ==============================

  const handleReceiverChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setReceiverId(Number(event.target.value));
  };

  // ==============================
  // Send Test Message
  // ==============================

  const sendTestMessage = () => {
    const testMessage = {
      sender_id: currentUserId,
      receiver_id: receiverId,
      message: `Hello from User ${currentUserId}!`,
    };

    console.log("📨 Sending test message:", testMessage);

    socket.emit("send_message", testMessage);
  };

  return (
    <>
      {/* ============================== */}
      {/* CollabSphere */}
      {/* ============================== */}

      <div
        style={{
          padding: "20px",
          textAlign: "center",
        }}
      >
        <h1>CollabSphere</h1>

        {/* ============================== */}
        {/* Login User */}
        {/* ============================== */}

        <div style={{ marginBottom: "15px" }}>
          <label>
            Login as:{" "}
          </label>

          <select
            value={currentUserId}
            onChange={handleUserChange}
          >
            <option value={1}>User 1</option>
            <option value={2}>User 2</option>
            <option value={3}>User 3</option>
            <option value={4}>User 4</option>
            <option value={5}>User 5</option>
          </select>
        </div>

        {/* ============================== */}
        {/* Chat With */}
        {/* ============================== */}

        <div style={{ marginBottom: "20px" }}>
          <label>
            Chat with:{" "}
          </label>

          <select
            value={receiverId}
            onChange={handleReceiverChange}
          >
            {currentUserId !== 1 && (
              <option value={1}>User 1</option>
            )}

            {currentUserId !== 2 && (
              <option value={2}>User 2</option>
            )}

            {currentUserId !== 3 && (
              <option value={3}>User 3</option>
            )}

            {currentUserId !== 4 && (
              <option value={4}>User 4</option>
            )}

            {currentUserId !== 5 && (
              <option value={5}>User 5</option>
            )}
          </select>
        </div>

        {/* ============================== */}
        {/* Test Message */}
        {/* ============================== */}

        <button
          type="button"
          onClick={sendTestMessage}
        >
          Send Test Message
        </button>

        {/* ============================== */}
        {/* Chat Component */}
        {/* ============================== */}

        <div
          style={{
            marginTop: "30px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Chat
            currentUserId={currentUserId}
            receiverId={receiverId}
          />
        </div>
      </div>

      {/* ============================== */}
      {/* Original Vite Content */}
      {/* ============================== */}

    </>
  );
}

export default App;