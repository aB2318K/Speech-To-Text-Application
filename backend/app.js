const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const express = require('express');
const cors = require('cors');
const User = require('./models/User');
const Speech = require('./models/Speech');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const multer = require('multer');
const { createServer } = require('node:http'); 
const { Server } = require('socket.io');
const { SpeechClient } = require('@google-cloud/speech');
const fs = require('fs');
const Buffer = require('buffer').Buffer;

const app = express();
app.use(cors({ origin: 'https://speech-to-text-application.onrender.com/' }));
app.use(express.json());
require('dotenv').config();

const base64Credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

const credentials = JSON.parse(Buffer.from(base64Credentials, 'base64').toString('utf8'));

const speechClient = new SpeechClient({
  credentials: credentials,  
});

const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: "https://speech-to-text-application.onrender.com",
        methods: ["GET", "POST"],
        allowedHeaders: ['Content-Type'],
    }
});

// Handle the socket connection
io.on('connection', (socket) => {
    console.log('A user connected');

    let recognizeStream;

    const startRecognitionStream = () => {
        recognizeStream = speechClient
            .streamingRecognize({
                config: {
                    encoding: 'WEBM_OPUS',
                    sampleRateHertz: 16000,
                    languageCode: 'en-US',
                    enableAutomaticPunctuation: true,
                },
                interimResults: false,
            })
            .on('error', (err) => {
                console.error('Speech-to-Text streaming error:', err);
                socket.emit('transcription', 'Error during transcription');
                recognizeStream = null; 
            })
            .on('data', (data) => {
                const transcription = data.results
                    .map(result => result.alternatives[0].transcript)
                    .join('\n');
                console.log('Transcription:', transcription);
                socket.emit('transcription', transcription);
            });
    };

    socket.on('audioData', (data) => {
        if (!recognizeStream) {
            console.log('Starting recognition stream');
            startRecognitionStream();
        }

        try {
            // Convert incoming ArrayBuffer to Buffer
            const audioBuffer = Buffer.from(new Uint8Array(data));
            recognizeStream.write(audioBuffer);
        } catch (err) {
            console.error('Error writing audio data to stream:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });

    socket.on('stopAudio', () => {
        console.log('Stopping recognition stream');
        if (recognizeStream) {
            recognizeStream.end();
            recognizeStream = null;
        }
    });
});

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
.then(() => console.log('Connected to MongoDB'))
.catch((error) => console.log('Error connecting to MongoDB:', error));

//hash password 
async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}


//compare the has password with the password during login phase
async function comparePasswords(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
}


//generate token for a period of 2 hour
function generateToken(user) {
    return jwt.sign({id: user.id}, process.env.JWT_SECRET_KEY, {
        expiresIn: '2h', //set token expiration time
    });
}

function generateSecretToken(user) {
    return jwt.sign(
        { id: user.id },
        process.env.JWT_RESET_SECRET_KEY, 
        { expiresIn: '2h' }  
    );
}

//login auhentication flow
async function loginUser(req, res) {
    const { email, password } = req.body;

    try {
        const currentUser = await User.findOne({ email });
        if (!currentUser) {
            return res.status(404).json({ message: 'User cannot be not found' });
        }

        const checkIfPasswordValid = await comparePasswords(password, currentUser.password);
        if (!checkIfPasswordValid) {
            return res.status(401).json({ message: 'Access denied, passwords do not match' });
        }

        const token = generateToken(currentUser);
        res.status(200).json({ message: 'Login was successful', token, userID: currentUser._id });
    } catch (error) {
        res.status(400).json({ message: 'Error during login', error: error.message });
    }

}

//sign up authentication flow
async function signUpUser(req, res) {
    const { firstname, lastname, email, password } = req.body;

    try {
        // Check if the user with this email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: '*This email is already registered. Try logging in instead.' });
        }

        // Hash the password
        const hashedPassword = await hashPassword(password);

        // Create new user instance
        const newUser = new User({
            firstname,
            lastname,
            email,
            password: hashedPassword
        });

        // Save new user to the database
        const savedUser = await newUser.save();
        res.status(201).json({ message: 'Registration was successful', user: savedUser });
    } catch (error) {
        console.error('Error during sign up:', error.message);
        res.status(500).json({ message: 'An error occurred during sign up.', error: error.message });
    }
}

//middle for JWT authentication
function authenticateToken(req, res, next) { 
    const token = req.header('Authorization')?.split(' ')[1];
    if(!token) {
        return res.status(401).json({ message: 'Access denied, no token given'});
    }

    try {
        const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = decode;
        next();
    }
    catch(error) {
        res.status(400).json({message: 'Invalid token'})
    }
}

app.get('/authenticate', authenticateToken, (req, res) => {
    res.json({ message: 'You have been granted protected access', user: req.user});
})

app.post('/signup', signUpUser);

app.post('/login', loginUser);

//Create new speech
app.post('/speeches', authenticateToken, async (req, res) => {
    try {
        const { title, speechData, userId } = req.body;

        // Validate that userId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }

        const user = new mongoose.Types.ObjectId(userId); // Convert to ObjectId

        const newSpeech = new Speech({
            title,
            data: speechData,
            user 
        });

        const savedSpeech = await newSpeech.save();
        res.status(201).json(savedSpeech);
    } catch (error) {
        console.error('Error creating speech:', error); 
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

//Retrieve all user speeches
app.get('/speeches', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.query; 
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);

        const speeches = await Speech.find({ user: userObjectId });
        if (speeches.length === 0) {
            return res.status(404).json({ message: 'No speeches found for this user.' });
        }

        return res.status(200).json(speeches);
    } catch (error) {
        console.error('Error fetching speeches:', error);
        return res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

//Retrieve speech by speech ID
app.get('/speeches/:speechId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.query; 
        const { speechId } = req.params;

        // Check if both userId and speechId are valid MongoDB Object IDs
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(speechId)) {
            return res.status(400).json({ message: 'Invalid user ID or speech ID.' });
        }

        // Convert userId and speechId to MongoDB ObjectId
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const speechObjectId = new mongoose.Types.ObjectId(speechId);

        // Find the speech by speechId
        const speech = await Speech.findOne({ _id: speechObjectId });

        if (!speech) {
            return res.status(404).json({ message: 'Speech not found.' });
        }

        // Check if the speech's user matches the provided userId
        if (!speech.user.equals(userObjectId)) {
            return res.status(403).json({ message: 'Access denied. Unauthorized user.' });
        }

        // Return the speech if userId matches
        return res.status(200).json(speech);
    } catch (error) {
        console.error('Error fetching speech:', error);
        return res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

//Edit speech by speech ID
app.put('/speeches/:speechId', authenticateToken, async(req, res) => {
    try {
        const { speechId  } = req.params;
        const { title, data, userId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(speechId)) {
            return res.status(400).json({ message: 'Invalid user ID or speech ID.' });
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);
        const speechObjectId = new mongoose.Types.ObjectId(speechId);

        const speech = await Speech.findOne({ _id: speechObjectId });

        if (!speech) {
            return res.status(404).json({ message: 'Speech not found.' });
        }

        if (!speech.user.equals(userObjectId)) {
            return res.status(403).json({ message: 'Access denied. Unauthorized user.' });
        }

        speech.title = title;
        speech.data = data;

        const updatedSpeech = speech.save();
        res.status(200).json(updatedSpeech)
    } catch (error) {
        console.error('Error updating speech:', error);
        return res.status(500).json({ message: 'Server error.', error: error.message });
    }
})

//Delete speech by speech ID
app.delete('/speeches/:speechId', authenticateToken, async (req, res) => {
    try {
        const { speechId } = req.params;
        const { userId } = req.body;
        if (!mongoose.Types.ObjectId.isValid(speechId) || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID or speech ID.' });
        }
        const speech = await Speech.findById(speechId);

        if (!speech) {
            return res.status(404).json({ message: 'Speech not found.' });
        }

        // Check if the user owns the speech
        if (!speech.user.equals(userId)) {
            return res.status(403).json({ message: 'Access denied. Unauthorized user.' });
        }

        // Delete the speech
        await Speech.deleteOne({ _id: speechId });

        res.status(200).json({ message: 'Speech deleted successfully.' });

    } catch {
        console.error('Error deleting speech:', error);
        return res.status(500).json({ message: 'Server error.', error: error.message });
    }
})

//Get logged in User information
app.get('/user', authenticateToken, async(req, res) => {
    try {
        const { userId } = req.query; 

        // Check if both userId is a valid MongoDB Object IDs
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }

        // Convert userId and speechId to MongoDB ObjectId
        const userObjectId = new mongoose.Types.ObjectId(userId);

        // Find the speech by speechId
        const user = await User.findById(userObjectId);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Return the speech if userId matches
        return res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ message: 'Server error.', error: error.message });
    }
})

//Edit user information
app.put('/user/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const { infoName } = req.query;
        const { info } = req.body;

        // Validate the user ID
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);

        // Find the user by ID
        const user = await User.findById(userObjectId);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Update the field based on `infoName`
        if (infoName === 'firstname') {
            user.firstname = info;
        } else if (infoName === 'lastname') {
            user.lastname = info;
        } else {
            return res.status(400).json({ message: 'Invalid info name.' });
        }

        // Save the updated user
        const updatedUser = await user.save();
        res.status(200).json(updatedUser);

    } catch (error) {
        console.error('Error updating User Information:', error);
        return res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

//Change user password from profile page
app.put('/user/:userId/password', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const { currentPassword, newPassword } = req.body;

        // Validate the user ID
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Check if current password is correct
        const isPasswordValid = await comparePasswords(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: '*Invalid password.' });
        }

        // Check if new password is different from the current password
        const isSamePassword = await comparePasswords(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({ sameMessage: '*New password must be different from the current password.' });
        }

        // Hash the new password and update
        const hashedPassword = await hashPassword(newPassword);
        user.password = hashedPassword;

        // Save the updated user
        await user.save();

        res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
        console.error('Error updating password:', error);
        return res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

//Delete user by user ID
app.delete('/user', authenticateToken, async(req, res) => {
    try {
        const { userId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID or speech ID.' });
        }
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        //Delete all the speeches associated with the user
        await Speech.deleteMany({ user: userId });

        // Delete the user
        await User.deleteOne({ _id: userId });

        res.status(200).json({ message: 'User deleted successfully.' });

    } catch {
        console.error('Error deleting speech:', error);
        return res.status(500).json({ message: 'Server error.', error: error.message });
    }
})

//Sending password reset link to email
app.post('/reset', async(req, res) => {
    const { email } = req.body;
    try {
        const existingUser = await User.findOne({ email });

        if (!existingUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const resetToken = generateSecretToken(existingUser);
        const resetId = crypto.randomBytes(16).toString('hex');
        existingUser.resetToken = resetToken;        
        existingUser.resetId = resetId;
        await existingUser.save();
        const mailer = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            }
        });

        const resetLink = `http://localhost:3000/new-password/${resetId}`;
        const options = {
            to: existingUser.email,
            from: 'no-reply@gmail.com',
            subject: 'Password Reset',
            text: `Click the link below to reset your password:\n\n${resetLink}\n\nThis link will expire in 2 hours`
        }
        await mailer.sendMail(options)      
        return res.status(200).json({ message: 'Password reset email sent.' });
    } catch (error) {
        console.log('Error finding user:', error);
        return res.status(500).json({ message: 'Server error.', error: error.message })
    }
})

//Retrieving reset token
app.get('/reset-password', async(req, res) => {
    const { resetId } = req.query;
    try {
        const existingUser = await User.findOne({ resetId });

        if (!existingUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        return res.status(200).json(existingUser.resetToken);

    } catch (error) {
        return res.status(500).json({ message: 'Server error.', error: error.message })
    }
})

//Resetting password
app.post('/reset-password', async(req, res) => {
    const { newPassword, resetToken } = req.body;
    try {
        // Verify the reset token
        const decoded = jwt.verify(resetToken, process.env.JWT_RESET_SECRET_KEY);  
        const userId = decoded.id;

        // Find the user associated with the reset token
        const existingUser = await User.findOne({ _id: userId, resetToken });

        if (!existingUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const isSamePassword = await comparePasswords(newPassword, existingUser.password);
        if (isSamePassword) {
            return res.status(400).json({ sameMessage: '*New password must be different from the current password.' });
        }

        existingUser.password = await hashPassword(newPassword);
        existingUser.resetToken = undefined;
        existingUser.resetId = undefined;
       
        await existingUser.save();
         
        return res.status(200).json({ message: 'Password successfully reset' });
    } catch (error) {
        console.log('Error resetting password:', error);
        return res.status(500).json({ message: 'Server error.', error: error.message })
    }
})


 
const PORT = process.env.PORT || 9000;
server.listen(PORT, () => console.log(`Server is running on ${PORT}`));
