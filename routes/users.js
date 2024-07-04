require('dotenv').config();
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const crypto = require('crypto');
const UserModel = require('../models/User.schema');
const { verifyToken } = require('../utilities/functions');
const env = process.env.NODE_ENV || 'development';
const baseURL =
    env === 'production'
        ? process.env.FRONTEND_PROD_URL
        : process.env.FRONTEND_LOCAL_URL;

router.get('/api/details', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await UserModel.findById(userId);
        if (user) {
            const currentSubscription =
                user.subscriptions.length > 0 ? user.subscriptions[0] : null;
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

router.post('/login', (req, res, next) => {
    passport.authenticate('local', { session: false }, (err, user, info) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        if (!user) {
            return res.status(401).send('Authentication failed');
        }
        const userId = user.id;
        const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });
        res.send({ message: 'Logged in successfully', token });
    })(req, res, next);
});

router.post('/register', async (req, res) => {
    try {
        const users = await UserModel.getAllUsers();
        const existingUser = users.find(
            (user) =>
                user.email === req.body.email ||
                user.mobile === req.body.mobileNumber
        );

        if (existingUser) {
            return res
                .status(400)
                .send(
                    'User already registered with the given email or mobile number'
                );
        }

        const verificationCode = crypto
            .randomBytes(4)
            .toString('hex')
            .toUpperCase();
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const tempUser = {
            id: Date.now().toString(),
            password: hashedPassword,
            email: req.body.email,
            mobile: req.body.mobileNumber,
            verificationCode,
            isVerified: false,
            createdAt: new Date().toISOString(),
        };

        await UserModel.addTempUser(tempUser); // Save temp user in temporary collection

        // Send verification email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: req.body.email,
            subject: 'Yedu AI Email Verification',
            text: `Your verification code is: ${verificationCode}`,
            html: `<div style="font-family: "Poppins", sans-serif; padding: 1rem 2rem;">
            <p style="line-height: 1.5"><strong>Good day</strong></p>
            <p style="line-height: 1.5">
                In order to proceed to use Yedu AI, enter the verification code below
            </p>
            <br />
            <h1><strong>${verificationCode}</strong></h1>
            <br />
            <hr />
            <p style="line-height: 1.5">Sincerely,</p>
            <h4>The YeduAI Team</h4>
            <br />
            <a href="mailto:admin@yeduai.io" style="background-color: #57C032; color: white; padding: 0.5rem 1rem; border-radius: 0.3rem; text-decoration: none;">Contact Support</a>
            <br />
        </div>`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error.toString());
                return res.status(500).send('Error sending verification email');
            }
            res.send('Verification email sent');
        });
    } catch (error) {
        console.log('Error in registration:', error);
        res.status(500).send('Error registering new user');
    }
});

router.post('/verify', async (req, res) => {
    try {
        const tempUser = await UserModel.getTempUserByEmail(req.body.email);

        if (
            !tempUser ||
            tempUser.verificationCode !== req.body.verificationCode
        ) {
            return res.status(400).send('Invalid verification code');
        }

        tempUser.isVerified = true;
        const newUser = {
            id: tempUser.id,
            password: tempUser.password,
            email: tempUser.email,
            mobile: tempUser.mobile,
            subscriptions: [
                {
                    amount: 5,
                    tokenCount: 0,
                    orderId: '',
                    id: Date.now().toString(),
                    createdAt: new Date().toISOString(),
                    updatedAt: [new Date().toISOString()],
                },
            ],
        };
        await UserModel.addUser(newUser); // Move verified user to main collection
        await UserModel.removeTempUser(tempUser.email); // Remove temp user

        res.send({ verified: tempUser.isVerified });
    } catch (error) {
        console.log('Error in verification:', error);
        res.status(500).send('Error verifying user');
    }
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    const user = await UserModel.findOne(email);

    if (!user) {
        return res.send('A password reset link has been sent to your email');
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: '1h',
    });
    const resetLink = `${baseURL}/?token=${token}`;

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
        text: `You requested a password reset. Click this reset link to reset your password: ${resetLink}`,
        html: `
        <div style="font-family: "Poppins", sans-serif; padding: 1rem 2rem;">
            <p style="line-height: 1.5"><strong>Hello there,</strong></p>
            <p style="line-height: 1.5">
                You are receiving this email because this email address was used to request a password reset on <strong>YeduAI</strong>. Please note that this link will expire after 1 hour. Click the button below to reset your password.
            </p>
            <br />
            <a href="${resetLink}" style="background-color: #57C032; color: white; padding: 0.5rem 1rem; border-radius: 0.3rem; text-decoration: none;">Reset Password</a>
            <br />
            <br />
            <p style="line-height: 1.5">
                Alternatively, you can copy the link below and paste it in your browser to reset your password.
            </p>
            <p>${resetLink}</p>
            <p style="line-height: 1.5">
                If you did not request a password request or you no longer wish to reset it, you can ignore this email and your password will remain unchanged.
            </p>
            <br />
            <hr />
            <p style="line-height: 1.5">Sincerely,</p>
            <h4>The YeduAI Team</h4>
            <br />
            <a href="mailto:admin@yeduai.io" style="background-color: #57C032; color: white; padding: 0.5rem 1rem; border-radius: 0.3rem; text-decoration: none;">Contact Support</a>
            <br />
        </div>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error.toString());
            return res.status(500).send(error.toString());
        }
        res.send('A password reset link has been sent to your email');
        console.log('Message sent: %s', info.messageId);
    });
});

router.get('/reset-password', (req, res) => {
    const { token } = req.query;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded) {
            res.send({ token });
        } else {
            res.status(400).send('Invalid token');
        }
    } catch (err) {
        res.status(400).send('Invalid or expired token');
    }
});

router.post('/reset-password', async (req, res) => {
    const { token, password, password2 } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findById(decoded.id);

    try {
        if (password !== password2) {
            return res.status(400).send('The passwords do not match.');
        }

        if (!user) {
            return res.status(404).send('User not found');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;

        const isUpdated = await UserModel.updateUser(user);

        if (isUpdated) {
            res.send('Password has been reset successfully');
        } else {
            res.status(500).send('Error updating user password');
        }
    } catch (err) {
        res.status(400).send('Invalid or expired token');
    }
});

router.post('/user-reset-password', verifyToken, async (req, res) => {
    const userId = req.user.id;
    const { password, password2 } = req.body;
    const user = await UserModel.findById(userId);

    try {
        if (password !== password2) {
            return res.status(400).send('The passwords do not match.');
        }

        if (!user) {
            return res.status(404).send('User not found');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;

        const isUpdated = await UserModel.updateUser(user);

        if (isUpdated) {
            res.send('Password has been reset successfully');
        } else {
            res.status(500).send('Error updating user password');
        }
    } catch (err) {
        res.status(400).send('Invalid or expired token');
    }
});

router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
    '/google/callback',
    passport.authenticate('google', { session: false }),
    (req, res) => {
        const socialToken = jwt.sign(
            {
                id: req.user.id,
                email: req.user.email,
                googleId: req.user.googleId,
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        const email = req.user.email;
        const googleId = req.user.googleId;
        res.redirect(
            `${baseURL}/user/auth/callback?socialToken=${socialToken}&email=${email}&provider=${googleId}`
        );
    }
);

router.get('/microsoft', passport.authenticate('microsoft'));

router.get(
    '/microsoft/callback',
    passport.authenticate('microsoft', { session: false }),
    (req, res) => {
        const socialToken = jwt.sign(
            {
                id: req.user.id,
                email: req.user.email,
                microsoftId: req.user.microsoftId,
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        const email = req.user.email;
        const microsoftId = req.user.microsoftId;
        res.redirect(
            `${baseURL}/user/auth/callback?socialToken=${socialToken}&email=${email}&provider=${microsoftId}`
        );
    }
);

module.exports = router;
