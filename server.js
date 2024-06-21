require('dotenv').config();
const path = require('path');
const express = require('express');
const bcrypt = require('bcrypt');
const {
    verifyToken,
    isSubscriptionAmountZero,
    verifyWebSocketToken,
} = require('./utilities/functions');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const UserModel = require('./models/User.schema');
const fs = require('fs').promises;
const AWS = require('aws-sdk');
const app = express();
const http = require('http').Server(app);
const cors = require('cors');

const { handleActions } = require('./gptActions');
const { handleAction } = require('./utilities/helper.utils');

// Import routes
const projectsRouter = require('./routes/projects');
const usersRouter = require('./routes/users');
const messagesRouter = require('./routes/messages');

// AWS S3 Configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

// File path for the users data
const usersFilePath = path.join(__dirname, './usersfile.json');

// Express middlewares
app.use(express.static('public'));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/projects', projectsRouter);
app.use('/users', usersRouter);
app.use('/api/messages', messagesRouter);

// Function to write users data to file
function writeUsersData(users) {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

// Passport local strategy setup
passport.use(
    new LocalStrategy({ usernameField: 'email' }, async function (
        email,
        password,
        done
    ) {
        try {
            let user = await UserModel.findOne(email);

            if (!user) {
                return done(null, false); // User not found
            }
            const matchPassword = await bcrypt.compare(password, user.password);
            if (!matchPassword) {
                return done(null, false); // Password does not match
            }
            return done(null, user); // Successful authentication
        } catch (err) {
            return done(err); // Handle error
        }
    })
);

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/users/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let users = await UserModel.getAllUsers();
                let user = users.find((user) => user.googleId === profile.id);
                if (!user) {
                    user = {
                        id: Date.now().toString(),
                        googleId: profile.id,
                        password: profile.id,
                        email: profile.emails[0].value,
                        name: profile.displayName,
                        subscriptions: [
                            {
                                amount: 5,
                                tokenCount: 0,
                                id: Date.now().toString(),
                                createdAt: new Date().toISOString(),
                                updatedAt: [new Date().toISOString()]
                            },
                        ],
                    };
                    await UserModel.addUser(user);
                }
                done(null, user);
            } catch (error) {
                done(error, null);
            }
        }
    )
);

passport.use(
    new MicrosoftStrategy(
        {
            clientID: process.env.MICROSOFT_CLIENT_ID,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
            callbackURL: '/users/microsoft/callback',
            scope: ['user.read'],
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let users = await UserModel.getAllUsers();
                let user = users.find((user) => user.googleId === profile.id);
                if (!user) {
                    user = {
                        id: Date.now().toString(),
                        microsoftId: profile.id,
                        password: profile.id,
                        email: profile.emails[0].value,
                        name: profile.displayName,
                        subscriptions: [
                            {
                                amount: 5,
                                tokenCount: 0,
                                id: Date.now().toString(),
                                createdAt: new Date().toISOString(),
                                updatedAt: [new Date().toISOString()]
                            },
                        ],
                    };
                    await UserModel.addUser(user);
                }
                done(null, user);
            } catch (error) {
                done(error, null);
            }
        }
    )
);

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
    await UserModel.findById(id, function (err, user) {
        done(err, user);
    });
});

app.use(passport.initialize());

const socketIO = require('socket.io')(http, {
    cors: {
        origin: 'http://localhost:3000', // Adjust the origin as needed
        methods: ['GET', 'POST'],
    },
    maxHttpBufferSize: 1e8, // 100 MB
});

socketIO.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }
        const decoded = await verifyWebSocketToken(token);
        socket.user = decoded; // Attach decoded user information to socket
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});

socketIO.on('connection', (socket) => {
    const userId = socket.user.id;
    socket.join(userId);
    socket.on('join', async (projectId) => {
        const subscribe = {
            messages: [
                {
                    messageId: `${Math.random().toString(36).substr(2, 5)}-message-${Math.random().toString(36).substr(2, 10)}`,
                    role: 'assistant',
                    content:
                        'Oops! 😅 Your credits have run out. To keep using the system, please purchase more tokens.\nThanks for being a part of our community!',
                    projectId: projectId,
                    timestamp: new Date().toISOString(),
                },
            ],
        };
        if (await isSubscriptionAmountZero(userId)) {
            socket.emit('initial-data', subscribe);
            return;
        }
        // Fetch initial data for the user
        const user = await UserModel.findById(userId);
        if (user) {
            const allMessages = await UserModel.getUserMessages(
                userId,
                projectId
            );
            const response = {
                messages: allMessages.filter(
                    (message) => message.role !== 'system'
                ),
            };
            // Send the initial data to the user
            socket.emit('initial-data', response);
        }
    });

    socket.on('get-user-details', async () => {
        const projectsData = await UserModel.getUserProjects(userId);
        const subscriptionAmount =
            await UserModel.getSubscriptionAmount(userId);
        const userResponse = {
            projects: projectsData,
            subscriptionAmount: subscriptionAmount,
        };
        socket.emit('user-data', userResponse);
    });

    socket.on('uploadImage', async (data) => {
        try {
            const buffer = Buffer.from(data.file, 'base64');
            const { message, projectId } = data;
            const userId = socket.user.id;
            const fileName = `${Date.now().toString()}-${data.fileName}`;
            const uploadDir = path.join(__dirname, 'uploads');
            const selectedProject = await UserModel.getUserProject(
                userId,
                projectId
            );

            // Ensure the upload directory exists
            try {
                await fs.mkdir(uploadDir, { recursive: true });
            } catch (mkdirErr) {
                console.error(
                    `Error creating directory ${uploadDir}:`,
                    mkdirErr
                );
                socket.emit(
                    'uploadError',
                    'Internal server error. Please try again later.'
                );
                return;
            }

            // Save the file temporarily
            const uploadPath = path.join(uploadDir, fileName);
            await fs.writeFile(uploadPath, buffer);

            // Upload to S3 using AWS SDK
            const params = {
                Bucket: 'my-sketches-bucket',
                Key: `sketches/${projectId}/${fileName}`,
                Body: buffer,
            };

            s3.upload(params, async (err, data) => {
                if (err) {
                    console.error('Error uploading to S3:', err);
                    socket.emit(
                        'uploadError',
                        'Failed to upload file. Please try again.'
                    );
                    return;
                }

                const imageUrl = data.Location;
                console.log(`File uploaded successfully at ${imageUrl}`);
                await UserModel.addSketchToProject(userId, projectId, imageUrl);

                try {
                    // Clean up the temporary file asynchronously
                    await fs.unlink(uploadPath);
                } catch (cleanupErr) {
                    console.error(
                        `Error cleaning up file ${uploadPath}:`,
                        cleanupErr
                    );
                }

                socketIO.to(userId).emit('new-message', {
                    role: 'user',
                    content: message,
                    imageUrl: imageUrl,
                });

                // Check for a selected project and its stage
                if (selectedProject) {
                    await processSelectedProject(
                        userId,
                        projectId,
                        message,
                        imageUrl
                    );
                }
            });
        } catch (err) {
            console.error(err);
            socket.emit('uploadError', err.message);
        }
    });

    socket.on('send-message', async (data) => {
        const { message, projectId } = data;
        const userId = socket.user.id;
        socketIO
            .to(userId)
            .emit('new-message', { role: 'user', content: message });
        const selectedProject = await UserModel.getUserProject(
            userId,
            projectId
        );

        // Check for a selected project and its stage
        if (selectedProject) {
            await processSelectedProject(userId, projectId, message);
        }
    });

    socket.on('user-profile', async () => {
        const user = await UserModel.findById(userId);
        if (user) {
            // Directly access the subscription if it exists
            const currentSubscription =
                user.subscriptions.length > 0 ? user.subscriptions[0] : null;

            // Determine subscription type based on amount
            let subscriptionType = 'Free Tier';
            if (currentSubscription) {
                const amount = currentSubscription.amount;
                if (amount >= 200) {
                    subscriptionType = 'Enterprise Tier';
                } else if (amount >= 20) {
                    subscriptionType = 'Premium Tier';
                } else if (amount >= 5) {
                    subscriptionType = 'Standard Tier';
                }
            }

            const userDetails = {
                email: user.email,
                mobile: user.mobile,
                subscription: subscriptionType,
                amountLeft: currentSubscription?.amount || 0,
            };

            socket.emit('profile-details', userDetails);
        } else {
            socket.emit('profile-details', {
                email: 'No email found',
                mobile: 'No phone number found',
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('🔥: A user disconnected');
    });
});

async function processSelectedProject(
    userId,
    projectId,
    userMessage,
    imageUrl = null
) {
    const action = await handleActions(userMessage, userId, projectId);

    const addMessage = async (response, hasUser = true) => {
        try {
            await UserModel.addMessage(
                userId,
                [
                    hasUser
                        ? {
                              role: 'user',
                              content: userMessage,
                              imageUrl: imageUrl,
                          }
                        : null,
                    { role: 'assistant', content: response },
                ].filter(Boolean),
                projectId
            );

            if (await isSubscriptionAmountZero(userId)) {
                socketIO.to(userId).emit('new-message', {
                    role: 'assistant',
                    content:
                        'Oops! 😅 Your credits have run out. To keep using the system, please purchase more tokens.\nThanks for being a part of our community!',
                });
                return;
            }

            socketIO
                .to(userId)
                .emit('new-message', { role: 'assistant', content: response });
        } catch (error) {
            console.error('Error adding message:', error);
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
        addMessage
    );
}

app.get('/api/user/messages', verifyToken, async (req, res) => {
    try {
        // req.user.id is set by the verifyToken middleware after token validation
        const userId = req.user.id;
        const projectId = req.body.projectId;

        // Get the messages for the authenticated user, optionally filtered by project
        const messages = await UserModel.getUserMessages(userId, projectId);
        res.send(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/api/user/subscription', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount } = req.body;

        // Convert amount to a number to prevent string concatenation
        const numericAmount = Number(amount);
        if (isNaN(numericAmount)) {
            return res.status(400).send('Invalid amount');
        }

        const user = await UserModel.findById(userId);
        if (user) {
            // If the user has an existing subscription, update it
            if (user.subscriptions && user.subscriptions.length > 0) {
                let currentSubscription = user.subscriptions[0]; // Assuming only one subscription exists
                currentSubscription.amount =
                    (Number(currentSubscription.amount) || 0) + numericAmount;
                currentSubscription.modifiedAt = new Date().toISOString(); // Update modification time
                currentSubscription.amountAdded = numericAmount; // Record the added amount
            } else {
                // Create a new subscription object and add it to the user's subscriptions
                const newSubscription = {
                    amount: numericAmount,
                    id: Date.now().toString(),
                    createdAt: new Date().toISOString(),
                    updatedAt: [new Date().toISOString()]

                };
                user.subscriptions = [newSubscription]; // Initialize with the new subscription
            }

            await user.save(); // Save the updated users array
            res.send(`Subscription updated.`);
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.error('Error updating subscription:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Start the server
const PORT = process.env.PORT || 8000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
