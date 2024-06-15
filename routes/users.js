require('dotenv').config();
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../User.schema');

// User login route
router.post('/login', (req, res, next) => {
    passport.authenticate('local', { session: false }, (err, user, info) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        if (!user) {
            return res.status(401).send('Authentication failed');
        }
        const userId = user.id;
        // Proceed with token generation and response
        const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });
        res.send({ message: 'Logged in successfully', token, userId });
    })(req, res, next);
});

// User registration route
router.post('/register', async (req, res) => {
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
                    amount: 0.5,
                    tokenCount: 0,
                    id: Date.now().toString(),
                    createdAt: new Date().toISOString(),
                },
            ],
        };

        // Add the new user
        User.addUser(newUser);

        const userId = newUser.id;
        // Proceed with token generation and response
        const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });
        // Send success response
        res.send({
            message: 'New user registered successfully',
            token,
            userId,
        });
    } catch (error) {
        console.log('Error in registration:', error);
        res.status(500).send('Error registering new user');
    }
});

// Forgot password route
router.post('/forgot-password', async (req, res) => {
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

    const resetLink = `${process.env.APP_DOMAIN}/user/login?token=${token}`;

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
      background-color: #57C032;
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
router.get('/reset-password', (req, res) => {
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
router.post('/reset-password', async (req, res) => {
    const { token, password, password2 } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = User.findById(decoded.id);

    try {
        if (password != password2) {
            return res.status(400).send('The passwords do not match.');
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

const generateToken = (user) => {
    return jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: '1h',
    });
};

router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
    '/google/callback',
    passport.authenticate('google', { session: false }),
    (req, res) => {
        const token = generateToken(req.user);
        res.redirect(`http://localhost:3000/user/auth/callback?token=${token}`);
    }
);

router.get('/microsoft', passport.authenticate('microsoft'));

router.get(
    '/microsoft/callback',
    passport.authenticate('microsoft', { session: false }),
    (req, res) => {
        const token = generateToken(req.user);
        res.redirect(`http://localhost:3000/user/auth/callback?token=${token}`);
    }
);

router.get('/apple', passport.authenticate('apple'));

router.post(
    '/apple/callback',
    passport.authenticate('apple', { session: false }),
    (req, res) => {
        const token = generateToken(req.user);
        res.redirect(`http://localhost:3000/user/auth/callback?token=${token}`);
    }
);

module.exports = router;
