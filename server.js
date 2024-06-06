require('dotenv').config();
const path = require('path');
const express = require('express');
const globalState = require('./globalState');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./User.schema');
const fs = require('fs').promises;
const fileSystem = require('fs');
const AutoMode = require('./autoMode');
const app = express();
const http = require('http');

const server = http.createServer(app);
const cors = require('cors');
const multer = require('multer');
const {
    handleActions,
    handleIssues,
    handleUserReply,
} = require('./gptActions');
const { createApplication } = require('./createApplication');

// File path for the users data
const usersFilePath = path.join(__dirname, './usersfile.json');

// Express middlewares
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Middleware for Cross Origin Resource Scripting (CORS)
app.use(cors());

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

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

app.use(passport.initialize());

// JWT Verification Middleware
function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(403).send('A token is required for authentication');
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
    } catch (err) {
        return res.status(401).send('Invalid Token');
    }

    return next();
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

app.get(
    '/api/user/messages-and-subscription',
    verifyToken,
    async (req, res) => {
        try {
            // Fetch the user's ID from the decoded JWT token
            const userId = req.user.id;

            // Optionally get a projectId from the query string
            const { projectId } = req.query;

            // Find the user by their ID
            const user = await User.findById(userId);

            if (user) {
                // Filter and format messages with only role and content, based on projectId
                const formattedMessages = user.messages
                    .filter((msg) =>
                        projectId ? msg.projectId == projectId : true
                    )
                    .map((msg) => {
                        return {
                            messageId: msg.messageId,
                            role: msg.role,
                            content: msg.content,
                            timestamp: msg.timestamp,
                        };
                    });

                // Extract the subscription amount
                // Assuming the first subscription in the array is the current one
                const subscriptionAmount =
                    user.subscriptions.length > 0
                        ? user.subscriptions[0].amount
                        : 0;

                // Create the response object
                const response = {
                    messages: formattedMessages,
                    subscriptionAmount: subscriptionAmount,
                };

                // Send the response
                res.send(response);
            } else {
                res.status(404).send('User not found');
            }
        } catch (error) {
            console.error(
                'Error in /api/user/messages-and-subscription endpoint:',
                error
            );
            res.status(500).send('Internal Server Error');
        }
    }
);

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

// GET route for fetching user projects
app.get('/api/user/projects', verifyToken, async (req, res) => {
    try {
        // req.user.id is set by the verifyToken middleware after token validation
        const userId = req.user.id;

        // Get the projects for the authenticated user
        const projects = User.getUserProjects(userId);
        res.send(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
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

app.post('/api/user/create-project', verifyToken, async (req, res) => {
    try {
        // Destructure and validate input
        const { projectName, projectId } = req.body;
        if (!projectName || !projectId) {
            return res
                .status(400)
                .json({ error: 'Project name and ID are required.' });
        }

        // Prepare data
        const userId = req.user.id; // Assuming req.user is populated by verifyToken middleware
        const appName = projectName.toLowerCase().replace(/\s+/g, '-');

        // Add new project
        await addNewProject(userId, projectName, projectId, appName);

        // Send success response
        res.status(201).json({ message: 'Project created successfully.' });
    } catch (error) {
        console.error('Failed to create project:', error);

        // Determine if it's a user-caused error or server error
        const statusCode = error.isClientError ? 400 : 500;

        res.status(statusCode).json({ error: error.message });
    }
});

// User login route
app.post('/login', (req, res, next) => {
    passport.authenticate('local', { session: false }, (err, user, info) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        if (!user) {
            return res.status(401).send('Authentication failed');
        }
        // Proceed with token generation and response
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });
        res.send({ message: 'Logged in successfully', token });
    })(req, res, next);
});

// User registration route
app.post('/register', async (req, res) => {
    try {
        // Read existing users
        const users = User.users;

        // Check if user already exists with the same email or phone number
        const existingUser = users.find(
            (user) =>
                user.email === req.body.email ||
                user.mobile === req.body.mobileNumber
        );

        if (existingUser) {
            // If user exists, refuse registration and send a message to the frontend
            return res
                .status(400)
                .send(
                    'User already registered with the given email or mobile number'
                );
        }

        // If user does not exist, proceed with registration
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const newUser = {
            id: Date.now().toString(),
            password: hashedPassword,
            email: req.body.email,
            mobile: req.body.mobileNumber,
            subscriptions: [
                {
                    amount: 5,
                    id: Date.now().toString(),
                    createdAt: new Date().toISOString(),
                },
            ],
        };

        // Add the new user
        User.addUser(newUser);

        // Send success response
        res.send('User registered successfully');
    } catch (error) {
        console.log('Error in registration:', error);
        res.status(500).send('Error registering new user');
    }
});

// Forgot password route
app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    const user = User.findOne(email);

    if (!user) {
        return res.send(
            'If the email you have provided exists in our records, a password reset link will be sent to that email'
        ); // For security purposes, send this response to avoid data leaks
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: '1h',
    });

    const resetLink = `${process.env.APP_DOMAIN}/?token=${token}`;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Password Reset Request',
        text: `You requested a password reset. Click this reset link to reset your password: ${resetLink}`, // Plain text body
        html: `<style>
    div {
      font-family: "Poppins", sans-serif;
      padding: 1rem 2rem;
    }
    p {
      line-height: 1.5;
    }
    a {
      background-color: black;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 0.3rem;
      text-decoration: none;
    }
    a:hover {
      opacity: 0.8;
    }
  </style>
  <div>
    <p><strong>Hello there,</strong></p>
    <p>
      You are receiving this email because this email address was used to
      request a password reset on <strong>YeduAI</strong>. Please note that
      this link will expire after 1 hour. Click the button below to reset your
      password.
    </p>
    <br />
    <a href="${resetLink}">Reset Password</a>
    <br />
    <br />
    <p>
      Alternatively, you can copy the link below and paste it in your browser
      to reset your password.
    </p>
    <p>${resetLink}</p>
    <p>
      If you did not request a password request or you no longer wish to reset
      it, you can ignore this email and your password will remain unchanged.
    </p>
    <br />
    <hr />
    <p>Sincerely,</p>
    <h4>The YeduAI Team</h4>
    <br />
    <a href="mailto:admin@yeduai.io">Contact Support</a>
  </div>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send(error.toString());
        }
        res.send(
            'If the email you have provided exists in our records, a password reset link will be sent to that email'
        );
        console.log('Message sent: %s', info.messageId);
    });
});

// Route to validate the token
app.get('/reset-password', (req, res) => {
    const { token } = req.query;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if the decoded variable is valid
        if (decoded) {
            // Send the token to the client
            res.send({ token });
        } else {
            // Handle invalid token case
            res.status(400).send('Invalid token');
        }
    } catch (err) {
        res.status(400).send('Invalid or expired token');
    }
});

// Reset password route
app.post('/reset-password', async (req, res) => {
    const { token, password, password2 } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = User.findById(decoded.id);

    try {
        if (password != password2) {
            return res.send('The passwords do not match.');
        }

        if (!user) {
            return res.status(404).send('User not found');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;

        const isUpdated = User.updateUser(user);

        if (isUpdated) {
            res.send('Password has been reset successfully');
        } else {
            res.status(500).send('Error updating user password');
        }
    } catch (err) {
        res.status(400).send('Invalid or expired token');
    }
});

async function addNewProject(userId, projectName, id, appName) {
    try {
        // Retrieve the user data
        const user = User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Create a new project object with default values
        const newProject = {
            id: id, // Generate a unique ID for the project
            name: projectName,
            createdAt: new Date().toISOString(),
            projectOverview: null,
            taskList: [],
            appPath: null,
            appName: appName,
            stage: 0,
        };

        User.addProject(userId, newProject);
    } catch (error) {
        // Handle any errors that occur during the process
        console.error('Error adding new project:', error);
        throw error;
    }
}

app.delete('/api/cerebrum_v1/project', verifyToken, async (req, res) => {
    const userId = req.user.id;
    const projectId = req.body.projectId;

    async function deleteProjectDirectory(projectId) {
        const workspaceDir = path.join(__dirname, 'workspace');
        const projectDir = path.join(workspaceDir, projectId);
        const sessionDocsPath = path.join(__dirname, 'sessionDocs');
        const documentationFileName = path.join(
            sessionDocsPath,
            `documentation_${projectId}.txt`
        );

        try {
            // Check if the project directory exists
            await fs.access(projectDir);
            // Delete the project directory recursively
            await fs.rm(projectDir, { recursive: true, force: true });
            console.log(
                `Project directory ${projectDir} deleted successfully.`
            );
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log(`Project directory ${projectDir} does not exist.`);
            } else {
                throw new Error(
                    `Failed to delete project directory ${projectDir}: ${error.message}`
                );
            }
        }

        try {
            // Check if the documentation file exists
            await fs.access(documentationFileName);
            // Delete the documentation file
            await fs.unlink(documentationFileName);
            console.log(
                `Documentation file ${documentationFileName} deleted successfully.`
            );
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log(
                    `Documentation file ${documentationFileName} does not exist.`
                );
            } else {
                throw new Error(
                    `Failed to delete documentation file ${documentationFileName}: ${error.message}`
                );
            }
        }
    }

    try {
        User.deleteProject(userId, projectId);
        await deleteProjectDirectory(projectId);
        // Delete the state associated with the project
        const autoMode = new AutoMode('./autoModeState.json', projectId);
        autoMode.deleteProjectState(projectId);
        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/cerebrum_v1', verifyToken, async (req, res) => {
    const userId = req.user.id;
    globalState.initializeSession(userId);
    const userMessage = req.body.message;
    const projectId = req.body.projectId;

    const selectedProject = User.getUserProject(userId, projectId)[0];

    // Check for a selected project and its stage
    if (selectedProject) {
        await processSelectedProject(
            selectedProject,
            userId,
            projectId,
            userMessage,
            res
        );
        return;
    }

    // Handle user states without a selected project
    await handleSentimentAnalysis(res, userId, userMessage, projectId);
});

function uploadFiles(req, res, projectId) {
    const UPLOAD_DIR = path.join(
        __dirname,
        `workspace/${projectId}/src/static_files`
    );

    // Create the upload directory if it doesn't exist
    if (!fileSystem.existsSync(UPLOAD_DIR)) {
        fileSystem.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    // Configure multer for file upload
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, UPLOAD_DIR);
        },
        filename: (req, file, cb) => {
            cb(null, file.originalname);
        },
    });

    const upload = multer({
        storage: storage,
        limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
        fileFilter: (req, file, cb) => {
            const filetypes = /jpeg|jpg|png|webp|pdf/;
            const mimetype = filetypes.test(file.mimetype);
            const extname = filetypes.test(
                path.extname(file.originalname).toLowerCase()
            );

            if (mimetype && extname) {
                return cb(null, true);
            } else {
                cb(new Error('Only images and PDF files are allowed!'));
            }
        },
    }).array('files', 5);

    // Check the number of files in the upload directory
    fileSystem.readdir(UPLOAD_DIR, (err, files) => {
        if (err) {
            return res.status(500).send('Error reading upload directory');
        }

        if (files.length >= 5) {
            return res.status(400).send('Upload limit reached!');
        }

        upload(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                return res.status(400).send(err.message);
            } else if (err) {
                return res.status(400).send(err.message);
            }

            const userInput = req.body.userInput || 'No description provided';
            const uploadedFiles = req.body.files.map((file) => file.originalname);

            res.status(200).json({
                message: `${userInput} uploaded successfully`,
                userInput: userInput,
                uploadedFiles: uploadedFiles,
            });
        });
    });
}

app.post("/api/cerebrum_v1/projects/uploads", verifyToken, (req, res) => {
    const projectId = req.body.projectId;

    uploadFiles(req, res, projectId);
});

async function processSelectedProject(
    selectedProject,
    userId,
    projectId,
    userMessage,
    res
) {
    // Check if the stage is less than one and log the message
    if (selectedProject.stage === 0.5) {
        res.send('Please wait while your assets initialize');
        return; // Optionally, you can return here if you don't want to proceed further
    }

    if (selectedProject.stage === 1) {
        User.addMessage(
            userId,
            [{ role: 'user', content: userMessage }],
            projectId
        );

        return;
    }

    if (selectedProject.stage < 5) {
        console.log('check state', globalState.getAwaitingRequirements(userId));
        if (!globalState.getAwaitingRequirements(userId)) {
            await handleSentimentAnalysis(res, userId, userMessage, projectId);
        } else {
            await createApplication(projectId, userId);
        }
    } else {
        process.chdir(__dirname);
        try {
            await handleSentimentAnalysis(res, userId, userMessage, projectId);
        } catch (error) {
            console.error(error);
        }
    }
}

async function handleSentimentAnalysis(res, userId, userMessage, projectId) {
    const action = await handleActions(userMessage, userId, projectId);
    console.log('action', action);
    let response;
    switch (action) {
        case 'createApplication':
            response =
                'Sure, your project creation is already in progress. An AI assistant will contact you once all assets are ready.';

            User.addMessage(
                userId,
                [
                    { role: 'user', content: userMessage },
                    { role: 'assistant', content: response },
                ],
                projectId
            );
            await createApplication(projectId, userId);
            break;
        case 'modifyApplication':
            response = 'We are now modifying the existing application.';

            User.addMessage(
                userId,
                [
                    { role: 'user', content: userMessage },
                    { role: 'assistant', content: response },
                ],
                projectId
            );

            await handleIssues(userMessage, projectId, userId);
            break;
        case 'generalResponse':
            response = await handleUserReply(userMessage, userId, projectId);

            User.addMessage(
                userId,
                [
                    { role: 'user', content: userMessage },
                    { role: 'assistant', content: response },
                ],
                projectId
            );
            break;
        case 'reject':
            response = 'You can only create one project at a time!.';
            User.addMessage(
                userId,
                [
                    { role: 'user', content: userMessage },
                    { role: 'assistant', content: response },
                ],
                projectId
            );
            break;
        case 'error':
            response =
                'Sorry there seems to be an issue with the server. Please try again later.';
            User.addMessage(
                userId,
                [
                    { role: 'user', content: userMessage },
                    { role: 'assistant', content: response },
                ],
                projectId
            );
            break;
        default:
            res.status(400).send('Invalid action');
    }
}

server.listen(8000, () => {
    console.log('Server listening on port 8000');
});
