require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const pool = require("./config/db");

// ==========================================
// EXPRESS APP
// ==========================================

const app = express();

app.use(cors());
app.use(express.json());

// ==========================================
// HTTP SERVER
// ==========================================

const server = http.createServer(app);

// ==========================================
// SOCKET.IO
// ==========================================

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// ==========================================
// ONLINE USERS
// ==========================================

const onlineUsers = new Set();
const socketUsers = new Map();

// ==========================================
// ROUTES
// ==========================================

const authRoutes =
    require("./routes/authRoutes");

const projectRoutes =
    require("./routes/projectRoutes");

const teamRoutes =
    require("./routes/teamRoutes");

const applicationRoutes =
    require("./routes/applicationRoutes");

const dashboardRoutes =
    require("./routes/dashboardRoutes");

const learningCategoryRoutes =
    require("./routes/learningCategoryRoutes");

const learningTrackRoutes =
    require("./routes/learningTracksRoutes");

const courseRoutes =
    require("./routes/courseRoutes");

const moduleRoutes =
    require("./routes/moduleRoutes");

const lessonRoutes =
    require("./routes/lessonRoutes");

const lessonResourceRoutes =
    require("./routes/lessonResourceRoutes");

const progressRoutes =
    require("./routes/progressRoutes");

const courseProgressRoutes =
    require("./routes/courseProgressRoutes");

const enrollmentRoutes =
    require("./routes/enrollmentRoutes");

const quizRoutes =
    require("./routes/quizRoutes");

const quizQuestionRoutes =
    require("./routes/quizQuestionRoutes");

const quizAttemptRoutes =
    require("./routes/quizAttemptRoutes");

const certificateRoutes =
    require("./routes/certificateRoutes");

const taskRoutes =
    require("./routes/taskRoutes");

const notificationRoutes =
    require("./routes/notificationRoutes");

const messageRoutes =
    require("./routes/messageRoutes");

// ==========================================
// API ROUTES
// ==========================================

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/projects",
    projectRoutes
);

app.use(
    "/api/teams",
    teamRoutes
);

app.use(
    "/api/dashboard",
    dashboardRoutes
);

app.use(
    "/api/applications",
    applicationRoutes
);

// Learning

app.use(
    "/api/learning-categories",
    learningCategoryRoutes
);

app.use(
    "/api/learning-tracks",
    learningTrackRoutes
);

app.use(
    "/api/courses",
    courseRoutes
);

app.use(
    "/api/modules",
    moduleRoutes
);

app.use(
    "/api/lessons",
    lessonRoutes
);

app.use(
    "/api/lesson-resources",
    lessonResourceRoutes
);

app.use(
    "/api/progress",
    progressRoutes
);

app.use(
    "/api/course-progress",
    courseProgressRoutes
);

app.use(
    "/api/enrollments",
    enrollmentRoutes
);

// Quizzes

app.use(
    "/api/quizzes",
    quizRoutes
);

app.use(
    "/api/quiz-questions",
    quizQuestionRoutes
);

app.use(
    "/api/quiz-attempts",
    quizAttemptRoutes
);

// Certificates

app.use(
    "/api/certificates",
    certificateRoutes
);

// Tasks

app.use(
    "/api/tasks",
    taskRoutes
);

// Notifications

app.use(
    "/api/notifications",
    notificationRoutes
);

// Messages

app.use(
    "/api/messages",
    messageRoutes
);

// ==========================================
// HOME ROUTE
// ==========================================

app.get(
    "/",
    (req, res) => {
        res.send(
            "🚀 CollabSphere Backend Running Successfully"
        );
    }
);

// ==========================================
// SOCKET.IO LOGIC
// ==========================================

io.on(
    "connection",
    (socket) => {

        console.log(
            "🟢 User connected:",
            socket.id
        );

        // ==========================================
        // JOIN USER ROOM
        // ==========================================

        socket.on(
            "join_user",
            (userId) => {

                console.log(
                    "🔥 JOIN_USER EVENT RECEIVED"
                );

                console.log(
                    "👤 User ID received:",
                    userId
                );

                // Join personal room

                socket.join(
                    `user_${userId}`
                );

                // Store socket → user

                socketUsers.set(
                    socket.id,
                    Number(userId)
                );

                // Add user online

                onlineUsers.add(
                    Number(userId)
                );

                console.log(
                    `👤 User ${userId} joined room user_${userId}`
                );

                console.log(
                    "👥 Online users:",
                    [...onlineUsers]
                );

                // Send online users

                io.emit(
                    "online_users",
                    [...onlineUsers]
                );

                // Show room sockets

                const room =
                    io.sockets.adapter.rooms.get(
                        `user_${userId}`
                    );

                console.log(
                    `👥 Sockets in user_${userId}:`,
                    room
                        ? [...room]
                        : []
                );
            }
        );


        // ==========================================
        // TYPING START
        // ==========================================

        socket.on(
            "typing_start",
            (data) => {

                try {

                    const {
                        sender_id,
                        receiver_id
                    } = data;

                    console.log(
                        `✍️ User ${sender_id} is typing to User ${receiver_id}`
                    );

                    if (
                        !sender_id ||
                        !receiver_id
                    ) {
                        return;
                    }

                    // Send typing event
                    // ONLY to receiver

                    io.to(
                        `user_${receiver_id}`
                    ).emit(
                        "user_typing",
                        {
                            user_id:
                                Number(sender_id)
                        }
                    );

                } catch (error) {

                    console.error(
                        "❌ TYPING START ERROR:",
                        error
                    );
                }
            }
        );

// ==========================================
// MARK MESSAGES AS READ
// ==========================================

socket.on("mark_messages_read", async (data) => {
    try {
        const { reader_id, sender_id } = data;

        if (!reader_id || !sender_id) {
            return;
        }

        const result = await pool.query(
            `UPDATE messages
             SET is_read = true
             WHERE receiver_id = $1
             AND sender_id = $2
             AND is_read = false
             RETURNING *`,
            [reader_id, sender_id]
        );

        console.log(
            `👁️ User ${reader_id} read messages from User ${sender_id}`
        );

        // Notify the sender
        io.to(`user_${sender_id}`).emit(
            "messages_read",
            {
                reader_id,
                sender_id,
                messages: result.rows
            }
        );

    } catch (error) {
        console.error(
            "❌ MARK READ ERROR:",
            error
        );
    }
});
        // ==========================================
        // TYPING STOP
        // ==========================================

        socket.on(
            "typing_stop",
            (data) => {

                try {

                    const {
                        sender_id,
                        receiver_id
                    } = data;

                    console.log(
                        `⌨️ User ${sender_id} stopped typing`
                    );

                    if (
                        !sender_id ||
                        !receiver_id
                    ) {
                        return;
                    }

                    // Tell receiver typing stopped

                    io.to(
                        `user_${receiver_id}`
                    ).emit(
                        "user_stopped_typing",
                        {
                            user_id:
                                Number(sender_id)
                        }
                    );

                } catch (error) {

                    console.error(
                        "❌ TYPING STOP ERROR:",
                        error
                    );
                }
            }
        );


        // ==========================================
        // SEND MESSAGE
        // ==========================================

        socket.on(
            "send_message",
            async (data) => {

                try {

                    console.log(
                        "📨 Message received from frontend:",
                        data
                    );

                    const {
                        sender_id,
                        receiver_id,
                        message
                    } = data;

                    // Validate

                    if (
                        !sender_id ||
                        !receiver_id ||
                        !message
                    ) {

                        console.log(
                            "❌ Invalid message data"
                        );

                        return;
                    }

                    // ==========================================
                    // SAVE MESSAGE
                    // ==========================================

                    const result =
                        await pool.query(
                            `INSERT INTO messages
                            (sender_id, receiver_id, message)
                            VALUES ($1, $2, $3)
                            RETURNING *`,
                            [
                                sender_id,
                                receiver_id,
                                message
                            ]
                        );

                    const savedMessage =
                        result.rows[0];

                    console.log(
                        "💾 Message saved:",
                        savedMessage
                    );

                    // ==========================================
                    // STOP TYPING AUTOMATICALLY
                    // ==========================================

                    io.to(
                        `user_${receiver_id}`
                    ).emit(
                        "user_stopped_typing",
                        {
                            user_id:
                                Number(sender_id)
                        }
                    );

                    // ==========================================
                    // SEND TO RECEIVER
                    // ==========================================

                    io.to(
                        `user_${receiver_id}`
                    ).emit(
                        "receive_message",
                        savedMessage
                    );

                    // ==========================================
                    // SEND TO SENDER
                    // ==========================================

                    io.to(
                        `user_${sender_id}`
                    ).emit(
                        "message_sent",
                        savedMessage
                    );

                    console.log(
                        `📤 Message sent from User ${sender_id} to User ${receiver_id}`
                    );

                } catch (error) {

                    console.error(
                        "❌ SOCKET MESSAGE ERROR:",
                        error
                    );
                }
            }
        );


        // ==========================================
        // DISCONNECT
        // ==========================================

        socket.on(
            "disconnect",
            () => {

                console.log(
                    "🔴 User disconnected:",
                    socket.id
                );

                const userId =
                    socketUsers.get(
                        socket.id
                    );

                if (userId) {

                    socketUsers.delete(
                        socket.id
                    );

                    // Check if another socket
                    // belongs to same user

                    let stillConnected =
                        false;

                    for (
                        const connectedUserId
                        of socketUsers.values()
                    ) {

                        if (
                            Number(
                                connectedUserId
                            ) ===
                            Number(userId)
                        ) {

                            stillConnected =
                                true;

                            break;
                        }
                    }

                    // Mark offline only when
                    // no other connection exists

                    if (
                        !stillConnected
                    ) {

                        onlineUsers.delete(
                            Number(userId)
                        );
                    }

                    console.log(
                        "👥 Online users:",
                        [...onlineUsers]
                    );

                    // Update everyone

                    io.emit(
                        "online_users",
                        [...onlineUsers]
                    );
                }
            }
        );
    }
);

// ==========================================
// DATABASE CONNECTION TEST
// ==========================================

pool
    .query(
        "SELECT NOW()"
    )
    .then(
        (result) => {

            console.log(
                "✅ Database Connected"
            );

            console.log(
                result.rows[0]
            );
        }
    )
    .catch(
        (error) => {

            console.error(
                "❌ Database Connection Failed"
            );

            console.error(
                error.message
            );
        }
    );

// ==========================================
// START SERVER
// ==========================================

const PORT =
    process.env.PORT || 5000;

server.listen(
    PORT,
    () => {

        console.log(
            `Server is running on http://localhost:${PORT}`
        );

    }
);