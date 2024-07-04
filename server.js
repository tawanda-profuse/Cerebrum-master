require("dotenv").config();
const path = require("path");
const { v4: uuidv4 } = require('uuid');
const express = require("express");
const {
  isSubscriptionAmountZero,
  verifyWebSocketToken
} = require("./utilities/functions");
const passport = require("./passportSetup"); // Import the refactored passport setup
const UserModel = require("./models/User.schema");
const fs = require("fs").promises;
const AWS = require("aws-sdk");
const app = express();
const http = require("http").Server(app);
const cors = require("cors");
const env = process.env.NODE_ENV || "development";
const baseURL =
  env === "production"
    ? process.env.FRONTEND_PROD_URL
    : process.env.FRONTEND_LOCAL_URL;

const { handleActions } = require("./gptActions");
const { handleAction } = require("./utilities/helper.utils");
const { updateImageInDataJson } = require("./utilities/updateImageInDataJson");


// Import routes
const projectsRouter = require("./routes/projects");
const usersRouter = require("./routes/users");
const apiV2UsersRouter = require("./routes/api_v2_payments");

// AWS S3 Configuration
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Express middlewares
app.use(express.static("public"));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(passport.initialize());
app.use("/projects", projectsRouter);
app.use("/users", usersRouter);
app.use("/api/v2", apiV2UsersRouter);

const socketIO = require("socket.io")(http, {
  cors: {
    origin: baseURL,
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 1e8, // 100 MB
});

async function uploadToS3(buffer, projectId, fileName, folder) {
  const params = {
    Bucket: "my-sketches-bucket",
    Key: `${folder}/${projectId}/${fileName}`,
    Body: buffer,
  };

  return new Promise((resolve, reject) => {
    s3.upload(params, (err, data) => {
      if (err) reject(err);
      else resolve(data.Location);
    });
  });
}

// Reusable function for file handling
async function handleFileUpload(buffer, fileName, uploadDir) {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    const uploadPath = path.join(uploadDir, fileName);
    await fs.writeFile(uploadPath, buffer);
    return uploadPath;
  } catch (error) {
    console.error(`Error handling file upload: ${error}`);
    throw error;
  }
}

// Reusable function for cleaning up temporary files
async function cleanupTempFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Error cleaning up file ${filePath}:`, error);
  }
}

socketIO.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }
    const decoded = await verifyWebSocketToken(token);
    socket.user = decoded; // Attach decoded user information to socket
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
});

socketIO.on("connection", (socket) => {
  const userId = socket.user.id;
  socket.join(userId);
  socket.on("join", async (projectId) => {
    const subscribe = {
      messages: [
        {
          messageId: `${Math.random().toString(36).substr(2, 5)}-message-${Math.random().toString(36).substr(2, 10)}`,
          role: "assistant",
          content:
            "Oops! 😅 Your credits have run out. To keep using the system, please purchase more tokens.\nThanks for being a part of our community!",
          projectId: projectId,
          timestamp: new Date().toISOString(),
        },
      ],
    };
    if (await isSubscriptionAmountZero(userId)) {
      socket.emit("initial-data", subscribe);
      return;
    }
    // Fetch initial data for the user
    const user = await UserModel.findById(userId);
    if (user) {
      const allMessages = await UserModel.getUserMessages(userId, projectId);
      const response = {
        messages: allMessages.filter((message) => message.role !== "system"),
      };
      // Send the initial data to the user
      socket.emit("initial-data", response);
    }
  });

  socket.on("get-user-details", async () => {
    const projectsData = await UserModel.getUserProjects(userId);
    const subscriptionAmount = await UserModel.getSubscriptionAmount(userId);
    const userResponse = {
      projects: projectsData,
      subscriptionAmount: subscriptionAmount,
    };
    socket.emit("user-data", userResponse);
  });

  socket.on("get-project-completed", async (projectId) => {
    try {
      const userId = socket.user.id;
      const selectedProject = await UserModel.getUserProject(userId, projectId);
      const { isCompleted } = selectedProject;
      socketIO.to(userId).emit("project-completed-response", {
        projectCompleted: isCompleted,
      });
    } catch (err) {
      console.error(err);
      socket.emit("uploadError", err.message);
    }
  });

  socket.on("uploadImage", async (data) => {
    try {
      const { file, message, projectId, fileName } = data;
      const userId = socket.user.id;
      const buffer = Buffer.from(file, "base64");
      const uniqueFileName = `${Date.now()}-${uuidv4()}-${fileName}`;
      const uploadDir = path.join(__dirname, "uploads");

      const selectedProject = await UserModel.getUserProject(userId, projectId);
      const { isProcessing } = selectedProject;

      const uploadPath = await handleFileUpload(
        buffer,
        uniqueFileName,
        uploadDir,
      );

      const imageUrl = await uploadToS3(
        buffer,
        projectId,
        uniqueFileName,
        "sketches",
      );
      console.log(`File uploaded successfully at ${imageUrl}`);

      await UserModel.addSketchToProject(userId, projectId, imageUrl);

      cleanupTempFile(uploadPath);

      socketIO.to(userId).emit("new-message", {
        role: "user",
        content: message,
        imageUrl: imageUrl,
        projectProcessing: isProcessing,
      });

      socketIO.to(userId).emit("uploadSuccess", {
        role: "user",
        content: message,
        imageUrl: imageUrl,
        projectProcessing: isProcessing,
      });

      if (selectedProject) {
        await processSelectedProject(userId, projectId, message, imageUrl);
      }
    } catch (error) {
      console.error("Error in uploadImage:", error);
      socket.emit("uploadError", "Failed to upload file. Please try again.");
    }
  });

  socket.on("uploadAssetImages", async (data) => {
    try {
      const { filePayload, projectId } = data;
      const userId = socket.user.id;
      
      const uploadResults = [];
      for (const file of filePayload) {
        const buffer = Buffer.from(file.file, "base64");
        const fileName = `${Date.now()}-${uuidv4()}.jpg`;
        const imageUrl = await uploadToS3(
          buffer,
          projectId,
          fileName,
          "assets"
        );
        console.log(`File uploaded successfully at ${imageUrl}`);
        uploadResults.push({ id: file.id, url: imageUrl });
      }
  
      const updateResults = [];
      for (const { id, url } of uploadResults) {
        const result = await updateImageInDataJson(projectId, id, url);
        updateResults.push(result);
      }
  
      // Check if all updates were successful
      const allSuccessful = updateResults.every(
        (result) =>
          result ===
          "Image update successful. Please refresh your browser to see the changes."
      );
  
      if (allSuccessful) {
        socketIO
          .to(userId)
          .emit(
            "assetUploadSuccess",
            "Image update successful. Please refresh your browser to see the changes."
          );
      } else {
        const errorMessages = updateResults.filter(
          (result) =>
            result !==
            "Image update successful. Please refresh your browser to see the changes."
        );
        socketIO.to(userId).emit("assetUploadPartialSuccess", {
          message:
            "Sorry there were some issues updating your assets",
          errors: errorMessages,
        });
      }
    } catch (error) {
      console.error("Error in uploadAssetImages:", error);
      socket.emit(
        "assetUploadError",
        "Internal server error. Please try again later."
      );
    }
  });

  socket.on("send-message", async (data) => {
    const { message, projectId } = data;
    const userId = socket.user.id;
    socketIO.to(userId).emit("new-message", { role: "user", content: message });
    const selectedProject = await UserModel.getUserProject(userId, projectId);

    // Check for a selected project and its stage
    if (selectedProject) {
      await processSelectedProject(userId, projectId, message);
    }
  });

  socket.on("user-profile", async () => {
    const user = await UserModel.findById(userId);
    if (user) {
      // Directly access the subscription if it exists
      const currentSubscription =
        user.subscriptions.length > 0 ? user.subscriptions[0] : null;

      // Determine subscription type based on amount
      let subscriptionType = "Free Tier";
      if (currentSubscription) {
        const amount = currentSubscription.amount;
        if (amount >= 200) {
          subscriptionType = "Enterprise Tier";
        } else if (amount >= 20) {
          subscriptionType = "Premium Tier";
        } else if (amount >= 5) {
          subscriptionType = "Standard Tier";
        }
      }

      const userDetails = {
        email: user.email,
        mobile: user.mobile,
        subscription: subscriptionType,
        amountLeft: currentSubscription?.amount || 0,
      };

      socket.emit("profile-details", userDetails);
    } else {
      socket.emit("profile-details", {
        email: "No email found",
        mobile: "No phone number found",
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("🔥: A user disconnected");
  });
});

async function processSelectedProject(
  userId,
  projectId,
  userMessage,
  imageUrl = null,
) {
  const action = await handleActions(userMessage, userId, projectId);

  const addMessage = async (response, hasUser = true) => {
    try {
      await UserModel.addMessage(
        userId,
        [
          hasUser
            ? {
                role: "user",
                content: userMessage,
                imageUrl: imageUrl,
              }
            : null,
          { role: "assistant", content: response },
        ].filter(Boolean),
        projectId,
      );

      if (await isSubscriptionAmountZero(userId)) {
        socketIO.to(userId).emit("new-message", {
          role: "assistant",
          content:
            "Oops! 😅 Your credits have run out. To keep using the system, please purchase more tokens.\nThanks for being a part of our community!",
        });
        return;
      }

      const selectedProject = await UserModel.getUserProject(userId, projectId);
      const { isProcessing } = selectedProject;

      socketIO.to(userId).emit("new-message", {
        role: "assistant",
        content: response,
        projectProcessing: isProcessing,
      });
    } catch (error) {
      console.error("Error adding message:", error);
    }
  };
  const selectedProject = await UserModel.getUserProject(userId, projectId);
  const { sketches } = selectedProject;

  await handleAction(
    action,
    userMessage,
    userId,
    projectId,
    sketches,
    addMessage,
  );
}

// Start the server
const PORT = process.env.PORT || 8000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
