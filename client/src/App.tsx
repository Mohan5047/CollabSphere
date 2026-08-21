
import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import heroImg from "./assets/hero.png";

import Chat from "./chat";
import socket from "./socket";

import "./App.css";

function App() {
  const [currentUserId, setCurrentUserId] = useState(1);
const receiverId = currentUserId === 1 ? 2 : 1;
  const [count, setCount] = useState(0);

  // User 1 chats with User 2
  // User 2 chats with User 1
 
  useEffect(() => {
    console.log(
      "🚀 App useEffect is running"
    );

    console.log(
      "👤 Current user:",
      currentUserId
    );

    socket.emit(
      "join_user",
      currentUserId
    );

    console.log(
      "✅ join_user event emitted:",
      currentUserId
    );

    const handleReceiveMessage = (
      message: any
    ) => {
      console.log(
        "📩 Message received:",
        message
      );
    };

    const handleMessageSent = (
      message: any
    ) => {
      console.log(
        "📤 Message sent:",
        message
      );
    };

    socket.on(
      "receive_message",
      handleReceiveMessage
    );

    socket.on(
      "message_sent",
      handleMessageSent
    );

    return () => {
      socket.off(
        "receive_message",
        handleReceiveMessage
      );

      socket.off(
        "message_sent",
        handleMessageSent
      );
    };
  }, [currentUserId]);

  const sendTestMessage = () => {
    socket.emit(
      "send_message",
      {
        sender_id: currentUserId,
        receiver_id: receiverId,
        message:
          `Hello from User ${currentUserId}!`,
      }
    );

    console.log(
      "📨 Test message sent"
    );
  };

  return (
    <>
      {/* CollabSphere */}

      <div>
        <h1>CollabSphere</h1>

        {/* User Selector */}

        <div
          style={{
            marginBottom: "20px",
          }}
        >
          <label>
            Login as:{" "}
          </label>

          <select
            value={currentUserId}
            onChange={(event) =>
              setCurrentUserId(
                Number(event.target.value)
              )
            }
          >
            <option value={1}>
              User 1
            </option>

            <option value={2}>
              User 2
            </option>

            <option value={3}>
              User 3
            </option>

            <option value={4}>
              User 4
            </option>

            <option value={5}>
              User 5
            </option>
          </select>
        </div>

        {/* Test Message */}

        <button
          onClick={sendTestMessage}
        >
          Send Test Message
        </button>

        {/* Chat */}

        <div
          style={{
            marginTop: "30px",
          }}
        >
          <Chat
  currentUserId={currentUserId}
  receiverId={receiverId}
/>
        </div>
      </div>

      {/* Original Vite Content */}

      <section id="center">
        <div className="hero">
          <img
            src={heroImg}
            className="base"
            width="170"
            height="179"
            alt=""
          />

          <img
            src={reactLogo}
            className="framework"
            alt="React logo"
          />

          <img
            src={viteLogo}
            className="vite"
            alt="Vite logo"
          />
        </div>

        <div>
          <h1>
            Get started
          </h1>

          <p>
            Edit{" "}
            <code>
              src/App.tsx
            </code>{" "}
            and save to test{" "}
            <code>HMR</code>
          </p>
        </div>

        <button
          type="button"
          className="counter"
          onClick={() =>
            setCount(
              (count) => count + 1
            )
          }
        >
          Count is {count}
        </button>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg
            className="icon"
            role="presentation"
            aria-hidden="true"
          >
            <use href="/icons.svg#documentation-icon"></use>
          </svg>

          <h2>
            Documentation
          </h2>

          <p>
            Your questions, answered
          </p>

          <ul>
            <li>
              <a
                href="https://vite.dev/"
                target="_blank"
                rel="noreferrer"
              >
                <img
                  className="logo"
                  src={viteLogo}
                  alt=""
                />

                Explore Vite
              </a>
            </li>

            <li>
              <a
                href="https://react.dev/"
                target="_blank"
                rel="noreferrer"
              >
                <img
                  className="button-icon"
                  src={reactLogo}
                  alt=""
                />

                Learn more
              </a>
            </li>
          </ul>
        </div>

        <div id="social">
          <svg
            className="icon"
            role="presentation"
            aria-hidden="true"
          >
            <use href="/icons.svg#social-icon"></use>
          </svg>

          <h2>
            Connect with us
          </h2>

          <p>
            Join the Vite community
          </p>

          <ul>
            <li>
              <a
                href="https://github.com/vitejs/vite"
                target="_blank"
                rel="noreferrer"
              >
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>

                GitHub
              </a>
            </li>

            <li>
              <a
                href="https://chat.vite.dev/"
                target="_blank"
                rel="noreferrer"
              >
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#discord-icon"></use>
                </svg>

                Discord
              </a>
            </li>

            <li>
              <a
                href="https://x.com/vite_js"
                target="_blank"
                rel="noreferrer"
              >
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#x-icon"></use>
                </svg>

                X.com
              </a>
            </li>

            <li>
              <a
                href="https://bsky.app/profile/vite.dev"
                target="_blank"
                rel="noreferrer"
              >
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>

                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>

      <section id="spacer"></section>
    </>
  );
}

export default App;
