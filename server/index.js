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
// ROUTES
// ==========================================

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const teamRoutes = require("./routes/teamRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

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

app.use("/api/auth", authRoutes);

app.use("/api/projects", projectRoutes);

app.use("/api/teams", teamRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/applications", applicationRoutes);

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

// Messages / Chat
app.use(
    "/api/messages",
    messageRoutes
);

// ==========================================
// HOME ROUTE
// ==========================================

app.get("/", (req, res) => {
    res.send(
        "🚀 CollabSphere Backend Running Successfully"
    );
});

// ==========================================
// SOCKET.IO LOGIC
// ==========================================

io.on("connection", (socket) => {

    console.log(
        "🟢 User connected:",
        socket.id
    );
socket.on("join_user", (userId) => {
    socket.join(`user_${userId}`);

    socket.userId = userId;

    console.log(`👤 User ${userId} joined room user_${userId}`);

    // Tell everyone that this user is online
    io.emit("user_online", Number(userId));
});
    // -------------------------------
    // JOIN USER ROOM
    // -------------------------------
socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);

    if (socket.userId) {
        io.emit("user_offline", Number(socket.userId));
    }
});

    // -------------------------------
    // SEND MESSAGE
    // -------------------------------

    socket.on("send_message", async (data) => {
console.log("📨 Message received from frontend:", data);
        try {

            const {
                sender_id,
                receiver_id,
                message
            } = data;

            // Validate
            if (
                !sender_id ||
                !receiver_id ||
                !message ||
                !message.trim()
            ) {
                return;
            }

            // Save message
            const result = await pool.query(
                `
                INSERT INTO messages
                (
                    sender_id,
                    receiver_id,
                    message
                )
                VALUES
                ($1, $2, $3)
                RETURNING *
                `,
                [
                    sender_id,
                    receiver_id,
                    message.trim()
                ]
            );

            const savedMessage =
                result.rows[0];

            // Send to receiver
            io.to(`user_${receiver_id}`)
                .emit(
                    "receive_message",
                    savedMessage
                );

            // Send back to sender
            io.to(`user_${sender_id}`)
                .emit(
                    "message_sent",
                    savedMessage
                );

        } catch (error) {

            console.error(
                "❌ SOCKET MESSAGE ERROR:",
                error
            );

        }

    });


    // -------------------------------
    // DISCONNECT
    // -------------------------------

    socket.on("disconnect", () => {

        console.log(
            "🔴 User disconnected:",
            socket.id
        );

    });

});

// ==========================================
// DATABASE CONNECTION TEST
// ==========================================

pool
    .query("SELECT NOW()")
    .then((result) => {

        console.log(
            "✅ Database Connected"
        );

        console.log(
            result.rows[0]
        );

    })
    .catch((error) => {

        console.error(
            "❌ Database Connection Failed"
        );

        console.error(
            error.message
        );

    });

// ==========================================
// START SERVER
// ==========================================

const PORT =
    process.env.PORT || 5000;

server.listen(PORT, () => {

    console.log(
        `Server is running on http://localhost:${PORT}`
    );

});