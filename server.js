require('dotenv').config();
const path = require('path');
const express = require('express');
const bcrypt = require('bcrypt');
const { verifyToken } = require('./utilities/functions');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const AppleStrategy = require('passport-apple').Strategy;
const User = require('./User.schema');
const fs = require('fs').promises;
const app = express();
const http = require('http').Server(app);
const cors = require('cors');
const {
    handleActions,
    handleIssues,
    handleUserReply,
    handleGetReuirements
} = require('./gptActions');
const { createApplication } = require('./createApplication');

// Import routes
const projectsRouter = require('./routes/projects');
const usersRouter = require('./routes/users');
const messagesRouter = require('./routes/messages');
const { message } = require('statuses');

// File path for the users data
const usersFilePath = path.join(__dirname, './usersfile.json');

// Express middlewares
app.use(express.static('public'));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
// Middleware for Cross Origin Resource Scripting (CORS)
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
            let user = User.findOne(email);

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
                let user = User.users.find(
                    (user) => user.googleId === profile.id
                );
                if (!user) {
                    user = {
                        id: Date.now().toString(),
                        googleId: profile.id,
                        email: profile.emails[0].value,
                        name: profile.displayName,
                        subscriptions: [
                            {
                                amount: 5,
                                tokenCount: 0,
                                id: '1718022079531',
                                createdAt: '2024-06-10T12:21:19.531Z',
                            },
                        ],
                    };
                    User.addUser(user);
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
                let user = User.users.find(
                    (user) => user.microsoftId === profile.id
                );
                if (!user) {
                    user = {
                        id: Date.now().toString(),
                        microsoftId: profile.id,
                        email: profile.emails[0].value,
                        name: profile.displayName,
                        subscriptions: [
                            {
                                amount: 5,
                                tokenCount: 0,
                                id: '1718022079531',
                                createdAt: '2024-06-10T12:21:19.531Z',
                            },
                        ],
                    };
                    User.addUser(user);
                }
                done(null, user);
            } catch (error) {
                done(error, null);
            }
        }
    )
);

passport.use(
    new AppleStrategy(
        {
            clientID: process.env.APPLE_CLIENT_ID,
            teamID: process.env.APPLE_TEAM_ID,
            keyID: process.env.APPLE_KEY_ID,
            privateKey: process.env.APPLE_PRIVATE_KEY,
            callbackURL: '/users/apple/callback',
        },
        async (accessToken, refreshToken, idToken, profile, done) => {
            try {
                let user = User.users.find(
                    (user) => user.appleId === profile.id
                );
                if (!user) {
                    user = {
                        id: Date.now().toString(),
                        appleId: profile.id,
                        email: profile.email,
                        name: profile.name,
                    };
                    User.addUser(user);
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

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

app.use(passport.initialize());

const socketIO = require('socket.io')(http, {
    cors: {
        origin: 'http://localhost:3000', // Adjust the origin as needed
        methods: ['GET', 'POST'],
    },
});

socketIO.on('connection', (socket) => {
    console.log(`⚡: ${socket.id} user just connected!`);

    socket.on('join', async (userId, projectId) => {
        console.log(`User ${userId} is joining room ${projectId}`);
        socket.join(userId);

        // Fetch initial data for the user
        const user = await User.findById(userId);
        if (user) {
            const allMessages = User.getUserMessages(userId, projectId);

            const response = {
                messages: allMessages,
            };

            // Send the initial data to the user
            socket.emit('initial-data', response);
        }
    });

    socket.on('send-message', async (data) => {
        // // Broadcast the message to all clients in the room
        console.log('Received message:', data);
        const { userId, message, projectId } = data;
        socketIO
            .to(userId)
            .emit('new-message', { role: 'user', content: message });
        const userMessage = message;
        const selectedProject = User.getUserProject(userId, projectId)[0];

        // Check for a selected project and its stage
        if (selectedProject) {
            await processSelectedProject(
                userId,
                projectId,
                userMessage
            );
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
) {
    const action = await handleActions(userMessage, userId, projectId);
    let response;

    const addMessage = (response, hasUser = true) => {
        User.addMessage(
            userId,
            [
                hasUser ? { role: 'user', content: userMessage } : null,
                { role: 'assistant', content: response },
            ].filter(Boolean),
            projectId
        );
        socketIO
            .to(userId)
            .emit('new-message', { role: 'assistant', content: response });
        console.log(response);
    };

    switch (action) {
        case 'getRequirements':
            response = await handleGetReuirements(userMessage, userId, projectId);
            addMessage(response);
            break;

        case 'createApplication':
            response = `Fantastic! I've got all the details I need. Time to start building your amazing project! 😊`;
            addMessage(response);
            await createApplication(projectId, userId);
            response = `Great news! Your project has been built successfully. You can check it out at http://localhost:5001/${projectId}. If you need any adjustments, just let me know and I'll take care of it for you.`
            addMessage(response,false)
            break;

        case 'modifyApplication':
            response =
                'Got it! I am now modifying the existing application, wait a while....';
            addMessage(response);
            await handleIssues(userMessage, projectId, userId);
            response = 'I have finished modifying your application as requested.';
            addMessage(response, false);
            break;

        case 'generalResponse':
            response = await handleUserReply(userMessage, userId, projectId);
            addMessage(response);
            break;

        case 'reject':
            response = 'You can only create one project at a time!.';
            addMessage(response);
            break;

        case 'error':
            response =
                'Sorry, there seems to be an issue with the server. Please try again later.';
            addMessage(response);
            break;

        default:
            console.log('issue with sentiment analysis')
            return; // Add return to ensure the function exits here
    }
}

app.get('/api/tiers', async (req, res) => {
    const subscriptionTiers = [
        {
            name: 'Free Tier',
            price: 0,
            tokenUsage: '100K tokens per month',
            overageCost: '$0.10 per 1K tokens',
            benefits:
                'Comes with $5 free credits upon sign up, Ideal as a trial for new users, serving as an entry point for potential upgrading.',
            targetAudience:
                'Individuals or small businesses evaluating the service.',
        },
        {
            name: 'Standard Tier',
            price: 5,
            tokenUsage: '500K tokens per month',
            overageCost: '$0.08 per 1K tokens',
            benefits:
                'Provides more value than the Free Tier, suitable for regular use without a significant investment.',
            targetAudience:
                'Regular users or small businesses with moderate usage needs.',
        },
        {
            name: 'Premium Tier',
            price: 20,
            tokenUsage: '1M tokens per month',
            overageCost: '$0.07 per 1K tokens',
            benefits:
                'Significantly more tokens than the Standard Tier, offering better value for higher usage.',
            targetAudience:
                'Businesses or users with higher usage requirements.',
        },
        {
            name: 'Enterprise Tier',
            price: 200,
            tokenUsage: 'Unlimited usage',
            overageCost: '$0.06 per 1K tokens',
            benefits:
                'Priority support, custom integration options, and tailored solutions, better value for higher usage.',
            targetAudience:
                'Large organizations requiring extensive usage and specialized services.',
        },
    ];
    try {
        // Simply return the array of subscription tiers
        res.send(subscriptionTiers);
    } catch (error) {
        console.error('Error fetching subscription tiers:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/api/user/details', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
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

            res.send(userDetails);
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/api/user/messages', verifyToken, async (req, res) => {
    try {
        // req.user.id is set by the verifyToken middleware after token validation
        const userId = req.user.id;
        const projectId = req.body.projectId;

        // Get the messages for the authenticated user, optionally filtered by project
        const messages = User.getUserMessages(userId, projectId);
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

        const user = await User.findById(userId);
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
                };
                user.subscriptions = [newSubscription]; // Initialize with the new subscription
            }

            writeUsersData(User.users); // Save the updated users array
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
