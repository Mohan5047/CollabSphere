 import { useEffect, useState } from "react";
import socket from "./socket";

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface ChatProps {
  currentUserId: number;
  receiverId: number;
}

function Chat({
  currentUserId,
  receiverId,
}: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const [isReceiverTyping, setIsReceiverTyping] =
    useState(false);

  const isReceiverOnline =
    onlineUsers.includes(Number(receiverId));

  // ==========================================
  // JOIN USER + LOAD MESSAGE HISTORY
  // ==========================================

  useEffect(() => {
    console.log(
      "👤 Joining user room:",
      currentUserId
    );

    socket.emit(
      "join_user",
      currentUserId
    );

    // ==========================================
    // LOAD MESSAGE HISTORY
    // ==========================================

    const loadMessages = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/messages/${currentUserId}/${receiverId}`
        );

        const result =
          await response.json();

        if (result.success) {
          setMessages(result.data);

          console.log(
            "📚 Message history loaded:",
            result.data
          );
        }
      } catch (error) {
        console.error(
          "❌ Failed to load message history:",
          error
        );
      }
    };

    loadMessages();

    // ==========================================
    // ONLINE USERS
    // ==========================================

    const handleOnlineUsers = (
      users: number[]
    ) => {
      console.log(
        "🟢 Online users:",
        users
      );

      setOnlineUsers(
        users.map((user) =>
          Number(user)
        )
      );
    };

    // ==========================================
    // RECEIVE MESSAGE
    // ==========================================

    const handleReceiveMessage = (
      message: Message
    ) => {
      console.log(
        "📩 Received:",
        message
      );

      if (
        Number(message.sender_id) ===
          Number(receiverId) &&
        Number(message.receiver_id) ===
          Number(currentUserId)
      ) {
        setMessages((previous) => [
          ...previous,
          message,
        ]);

        setIsReceiverTyping(false);

        // Immediately mark the received
        // message as read because chat is open
        socket.emit(
          "mark_messages_read",
          {
            reader_id: currentUserId,
            sender_id: receiverId,
          }
        );
      }
    };

    // ==========================================
    // MESSAGE SENT
    // ==========================================

    const handleMessageSent = (
      message: Message
    ) => {
      console.log(
        "📤 Sent:",
        message
      );

      if (
        Number(message.sender_id) ===
          Number(currentUserId) &&
        Number(message.receiver_id) ===
          Number(receiverId)
      ) {
        setMessages((previous) => [
          ...previous,
          message,
        ]);
      }
    };

    // ==========================================
    // USER STARTED TYPING
    // ==========================================

    const handleUserTyping = (
      data: {
        user_id: number;
      }
    ) => {
      if (
        Number(data.user_id) ===
        Number(receiverId)
      ) {
        setIsReceiverTyping(true);
      }
    };

    // ==========================================
    // USER STOPPED TYPING
    // ==========================================

    const handleUserStoppedTyping = (
      data: {
        user_id: number;
      }
    ) => {
      if (
        Number(data.user_id) ===
        Number(receiverId)
      ) {
        setIsReceiverTyping(false);
      }
    };

    // ==========================================
    // MESSAGES READ
    // ==========================================

    const handleMessagesRead = (
      data: {
        reader_id: number;
        sender_id: number;
      }
    ) => {
      console.log(
        "👁️ Messages read:",
        data
      );

      // The receiver has read messages
      // that were sent by current user
      if (
        Number(data.reader_id) ===
        Number(receiverId)
      ) {
        setMessages((previous) =>
          previous.map((msg) => {
            if (
              Number(msg.sender_id) ===
                Number(currentUserId) &&
              Number(msg.receiver_id) ===
                Number(receiverId)
            ) {
              return {
                ...msg,
                is_read: true,
              };
            }

            return msg;
          })
        );
      }
    };

    // ==========================================
    // SOCKET LISTENERS
    // ==========================================

    socket.on(
      "online_users",
      handleOnlineUsers
    );

    socket.on(
      "receive_message",
      handleReceiveMessage
    );

    socket.on(
      "message_sent",
      handleMessageSent
    );

    socket.on(
      "user_typing",
      handleUserTyping
    );

    socket.on(
      "user_stopped_typing",
      handleUserStoppedTyping
    );

    socket.on(
      "messages_read",
      handleMessagesRead
    );

    // ==========================================
    // CLEANUP
    // ==========================================

    return () => {
      socket.off(
        "online_users",
        handleOnlineUsers
      );

      socket.off(
        "receive_message",
        handleReceiveMessage
      );

      socket.off(
        "message_sent",
        handleMessageSent
      );

      socket.off(
        "user_typing",
        handleUserTyping
      );

      socket.off(
        "user_stopped_typing",
        handleUserStoppedTyping
      );

      socket.off(
        "messages_read",
        handleMessagesRead
      );
    };
  }, [
    currentUserId,
    receiverId,
  ]);

  // ==========================================
  // MARK EXISTING MESSAGES AS READ
  // ==========================================

  useEffect(() => {
    if (
      !currentUserId ||
      !receiverId
    ) {
      return;
    }

    console.log(
      "👁️ Marking messages as read..."
    );

    socket.emit(
      "mark_messages_read",
      {
        reader_id: currentUserId,
        sender_id: receiverId,
      }
    );
  }, [
    currentUserId,
    receiverId,
  ]);

  // ==========================================
  // HANDLE TEXT CHANGE
  // ==========================================

  const handleTextChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value =
      event.target.value;

    setText(value);

    // ==========================================
    // USER STARTED TYPING
    // ==========================================

    if (
      value.trim().length > 0
    ) {
      socket.emit(
        "typing_start",
        {
          sender_id:
            currentUserId,
          receiver_id:
            receiverId,
        }
      );
    }

    // ==========================================
    // USER STOPPED TYPING
    // ==========================================

    else {
      socket.emit(
        "typing_stop",
        {
          sender_id:
            currentUserId,
          receiver_id:
            receiverId,
        }
      );
    }
  };

  // ==========================================
  // SEND MESSAGE
  // ==========================================

  const sendMessage = () => {
    const trimmedMessage =
      text.trim();

    if (!trimmedMessage) {
      return;
    }

    // Stop typing indicator
    socket.emit(
      "typing_stop",
      {
        sender_id:
          currentUserId,
        receiver_id:
          receiverId,
      }
    );

    const messageData = {
      sender_id:
        currentUserId,
      receiver_id:
        receiverId,
      message:
        trimmedMessage,
    };

    console.log(
      "📨 Sending message:",
      messageData
    );

    socket.emit(
      "send_message",
      messageData
    );

    setText("");
  };

  // ==========================================
  // ENTER KEY
  // ==========================================

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      event.key === "Enter"
    ) {
      event.preventDefault();

      sendMessage();
    }
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div
      style={{
        width: "500px",
        height: "600px",
        border:
          "1px solid #ccc",
        borderRadius: "12px",
        backgroundColor:
          "#ffffff",
        display: "flex",
        flexDirection:
          "column",
        position: "relative",
        zIndex: 9999,
        pointerEvents:
          "auto",
        overflow: "hidden",
      }}
    >
      {/* ================================= */}
      {/* HEADER */}
      {/* ================================= */}

      <div
        style={{
          padding: "18px",
          borderBottom:
            "1px solid #ddd",
          textAlign: "center",
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            margin: 0,
          }}
        >
          💬 Chat
        </h2>

        <p
          style={{
            margin:
              "8px 0 0",
            color: "#666",
          }}
        >
          User{" "}
          {currentUserId}
          {" → "}
          User{" "}
          {receiverId}
        </p>

        {/* ONLINE / OFFLINE */}

        <p
          style={{
            margin:
              "6px 0 0",
            color:
              isReceiverOnline
                ? "#16a34a"
                : "#777",
            fontWeight:
              "bold",
            fontSize:
              "14px",
          }}
        >
          {isReceiverOnline
            ? "🟢 Online"
            : "⚫ Offline"}
        </p>

        {/* TYPING */}

        {isReceiverTyping && (
          <p
            style={{
              margin:
                "6px 0 0",
              color:
                "#2563eb",
              fontSize:
                "13px",
              fontStyle:
                "italic",
            }}
          >
            ✍️ User{" "}
            {receiverId}{" "}
            is typing...
          </p>
        )}
      </div>

      {/* ================================= */}
      {/* MESSAGE AREA */}
      {/* ================================= */}

      <div
        style={{
          flex: 1,
          overflowY:
            "auto",
          padding:
            "20px",
          backgroundColor:
            "#fafafa",
        }}
      >
        {messages.length ===
        0 ? (
          <p
            style={{
              textAlign:
                "center",
              color:
                "#888",
            }}
          >
            No messages yet
          </p>
        ) : (
          messages.map(
            (msg) => (
              <div
                key={
                  msg.id
                }
                style={{
                  display:
                    "flex",
                  justifyContent:
                    Number(
                      msg.sender_id
                    ) ===
                    Number(
                      currentUserId
                    )
                      ? "flex-end"
                      : "flex-start",
                  marginBottom:
                    "12px",
                }}
              >
                <div
                  style={{
                    maxWidth:
                      "70%",
                    padding:
                      "10px 14px",
                    borderRadius:
                      "14px",
                    backgroundColor:
                      Number(
                        msg.sender_id
                      ) ===
                      Number(
                        currentUserId
                      )
                        ? "#2563eb"
                        : "#e5e7eb",
                    color:
                      Number(
                        msg.sender_id
                      ) ===
                      Number(
                        currentUserId
                      )
                        ? "#ffffff"
                        : "#111111",
                  }}
                >
                  <span>
                    {
                      msg.message
                    }
                  </span>

                  {/* READ STATUS */}

                  {Number(
                    msg.sender_id
                  ) ===
                    Number(
                      currentUserId
                    ) && (
                    <span
                      style={{
                        marginLeft:
                          "8px",
                        fontSize:
                          "12px",
                        opacity:
                          0.85,
                      }}
                    >
                      {msg.is_read
                        ? "✓✓"
                        : "✓"}
                    </span>
                  )}
                </div>
              </div>
            )
          )
        )}
      </div>

      {/* ================================= */}
      {/* INPUT */}
      {/* ================================= */}

      <div
        style={{
          display:
            "flex",
          gap: "10px",
          padding:
            "15px",
          borderTop:
            "1px solid #ddd",
          backgroundColor:
            "#ffffff",
          flexShrink: 0,
          position:
            "relative",
          zIndex: 10000,
          pointerEvents:
            "auto",
        }}
      >
        <input
          type="text"
          value={text}
          onChange={
            handleTextChange
          }
          onKeyDown={
            handleKeyDown
          }
          placeholder="Type a message..."
          autoComplete="off"
          style={{
            flex: 1,
            height:
              "42px",
            padding:
              "0 12px",
            border:
              "1px solid #aaa",
            borderRadius:
              "8px",
            fontSize:
              "16px",
            outline:
              "none",
            backgroundColor:
              "#ffffff",
            color:
              "#111111",
            position:
              "relative",
            zIndex:
              10001,
            pointerEvents:
              "auto",
          }}
        />

        <button
          type="button"
          onClick={
            sendMessage
          }
          style={{
            height:
              "42px",
            padding:
              "0 20px",
            border:
              "none",
            borderRadius:
              "8px",
            backgroundColor:
              "#2563eb",
            color:
              "#ffffff",
            cursor:
              "pointer",
            fontSize:
              "15px",
            position:
              "relative",
            zIndex:
              10001,
            pointerEvents:
              "auto",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Chat;