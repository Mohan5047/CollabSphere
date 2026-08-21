  import { useEffect, useState } from "react";
import socket from "./socket";

interface Message {
    id: number;
    sender_id: number;
    receiver_id: number;
    message: string;
    created_at: string;
}

interface ChatUser {
    id: number;
    full_name: string;
    email: string;
    role: string;
    team_id: number;
    team_name: string;
}

interface ChatProps {
    currentUserId: number;
    receiverId: number;
}

function Chat({ currentUserId }: ChatProps) {

    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState("");

    const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
    const [receiverId, setReceiverId] = useState<number | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
    // ==========================================
    // LOAD TEAM MEMBERS
    // ==========================================

    useEffect(() => {
const handleUserOnline = (userId: number) => {
    setOnlineUsers((previous) => {
        if (previous.includes(userId)) {
            return previous;
        }

        return [...previous, userId];
    });
};

const handleUserOffline = (userId: number) => {
    setOnlineUsers((previous) =>
        previous.filter((id) => id !== userId)
    );
};

socket.on("user_online", handleUserOnline);
socket.on("user_offline", handleUserOffline);

socket.off("user_online", handleUserOnline);
socket.off("user_offline", handleUserOffline);

        const loadChatUsers = async () => {

            try {

                const response = await fetch(
                    `http://localhost:5000/api/messages/users/${currentUserId}`
                );

                const result = await response.json();

                if (result.success) {

                    setChatUsers(result.data);

                    // Select first teammate automatically
                    if (
                        result.data.length > 0 &&
                        receiverId === null
                    ) {
                        setReceiverId(result.data[0].id);
                    }
                }

            } catch (error) {

                console.error(
                    "❌ Failed to load chat users:",
                    error
                );

            }

        };

        loadChatUsers();

    }, [currentUserId]);


    // ==========================================
    // JOIN ROOM + LOAD MESSAGE HISTORY
    // ==========================================

    useEffect(() => {

        if (receiverId === null) {
            return;
        }

        socket.emit("join_user", currentUserId);

        const loadMessages = async () => {

            try {

                const response = await fetch(
                    `http://localhost:5000/api/messages/${currentUserId}/${receiverId}`
                );

                const result = await response.json();

                if (result.success) {
                    setMessages(result.data);
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
        // RECEIVE MESSAGE
        // ==========================================

        const handleReceiveMessage = (
            message: Message
        ) => {

            // Only show messages belonging to
            // the currently selected conversation

            if (
                (
                    message.sender_id === receiverId &&
                    message.receiver_id === currentUserId
                )
            ) {

                setMessages((previous) => [
                    ...previous,
                    message
                ]);

            }

        };


        // ==========================================
        // MESSAGE SENT
        // ==========================================

        const handleMessageSent = (
            message: Message
        ) => {

            if (
                message.sender_id === currentUserId &&
                message.receiver_id === receiverId
            ) {

                setMessages((previous) => [
                    ...previous,
                    message
                ]);

            }

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

    }, [currentUserId, receiverId]);


    // ==========================================
    // SEND MESSAGE
    // ==========================================

    const sendMessage = () => {

        if (
            !text.trim() ||
            receiverId === null
        ) {
            return;
        }

        socket.emit("send_message", {

            sender_id: currentUserId,

            receiver_id: receiverId,

            message: text.trim()

        });

        setText("");

    };


    // ==========================================
    // ENTER KEY
    // ==========================================

    const handleKeyDown = (
        event: React.KeyboardEvent<HTMLInputElement>
    ) => {

        if (event.key === "Enter") {
            sendMessage();
        }

    };


    // ==========================================
    // SELECT USER
    // ==========================================

    const selectUser = (userId: number) => {

        setReceiverId(userId);

        setMessages([]);

    };


    // Find selected user's details

    const selectedUser = chatUsers.find(
        (user) => user.id === receiverId
    );


    return (

        <div
            style={{
                display: "flex",
                width: "800px",
                height: "500px",
                border: "1px solid #ddd",
                borderRadius: "12px",
                overflow: "hidden",
                background: "#fff"
            }}
        >

            {/* ==================================
                LEFT SIDE - TEAM MEMBERS
            ================================== */}

            <div
                style={{
                    width: "250px",
                    borderRight: "1px solid #ddd",
                    padding: "20px"
                }}
            >

                <h2>👥 Team Members</h2>

                {chatUsers.length === 0 ? (

                    <p>No teammates found.</p>

                ) : (

                    chatUsers.map((user) => (

                        <div
                            key={user.id}
                            onClick={() =>
                                selectUser(user.id)
                            }
                            style={{
                                padding: "12px",
                                marginBottom: "8px",
                                borderRadius: "8px",
                                cursor: "pointer",

                                background:
                                    receiverId === user.id
                                        ? "#e5e7eb"
                                        : "transparent"
                            }}
                        >

                            <strong>
                                👤 {user.full_name}
                            </strong>

                            <div
                                style={{
                                    fontSize: "12px",
                                    color: "#666",
                                    marginTop: "4px"
                                }}
                            >
                                {user.role}
                            </div>

                        </div>

                    ))

                )}

            </div>


            {/* ==================================
                RIGHT SIDE - CHAT
            ================================== */}

            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column"
                }}
            >

                {/* Header */}

                <div
                    style={{
                        padding: "15px 20px",
                        borderBottom: "1px solid #ddd"
                    }}
                >

                    {selectedUser ? (

                        <>
                            <strong>
                                💬 {selectedUser.full_name}
                            </strong>

                            <div
                                style={{
                                    fontSize: "12px",
                                    color: "#666"
                                }}
                            >
                                {selectedUser.team_name}
                            </div>
                        </>

                    ) : (

                        <strong>
                            Select a teammate
                        </strong>

                    )}

                </div>


                {/* Messages */}

                <div
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "20px"
                    }}
                >

                    {messages.length === 0 ? (

                        <p
                            style={{
                                textAlign: "center",
                                color: "#888"
                            }}
                        >
                            No messages yet. Start the conversation!
                        </p>

                    ) : (

                        messages.map((msg) => (

                            <div
                                key={msg.id}
                                style={{
                                    textAlign:
                                        msg.sender_id === currentUserId
                                            ? "right"
                                            : "left",

                                    marginBottom: "10px"
                                }}
                            >

                                <span
                                    style={{
                                        display: "inline-block",
                                        padding: "10px 14px",
                                        borderRadius: "12px",

                                        background:
                                            msg.sender_id === currentUserId
                                                ? "#2563eb"
                                                : "#e5e7eb",

                                        color:
                                            msg.sender_id === currentUserId
                                                ? "#fff"
                                                : "#111"
                                    }}
                                >
                                    {msg.message}
                                </span>

                            </div>

                        ))

                    )}

                </div>


                {/* Input */}

                <div
                    style={{
                        display: "flex",
                        gap: "8px",
                        padding: "15px",
                        borderTop: "1px solid #ddd"
                    }}
                >

                    <input
                        type="text"
                        value={text}
                        onChange={(event) =>
                            setText(event.target.value)
                        }
                        onKeyDown={handleKeyDown}
                        placeholder={
                            receiverId === null
                                ? "Select a teammate..."
                                : "Type a message..."
                        }
                        disabled={receiverId === null}
                        style={{
                            flex: 1,
                            padding: "10px",
                            borderRadius: "8px",
                            border: "1px solid #ccc"
                        }}
                    />

                    <button
                        onClick={sendMessage}
                        disabled={receiverId === null}
                        style={{
                            padding: "10px 16px",
                            borderRadius: "8px",
                            border: "none",
                            cursor: "pointer"
                        }}
                    >
                        Send
                    </button>

                </div>

            </div>

        </div>

    );
}

export default Chat;