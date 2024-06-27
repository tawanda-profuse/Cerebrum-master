require('dotenv').config();
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');
const { Buffer } = require('buffer');
const path = require('path');
const UserModel = require('./models/User.schema');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const aiProvider = process.env.AI_PROVIDER;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const acceptedMediaTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
];

function getMediaTypeFromUrl(url) {
    const ext = path.extname(url).toLowerCase();
    switch (ext) {
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.png':
            return 'image/png';
        case '.gif':
            return 'image/gif';
        case '.webp':
            return 'image/webp';
        default:
            return 'application/octet-stream';
    }
}

async function urlToBase64(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const base64Image = Buffer.from(response.data, 'binary').toString(
            'base64'
        );
        let mediaType = response.headers['content-type'];

        if (!acceptedMediaTypes.includes(mediaType)) {
            mediaType = getMediaTypeFromUrl(url);
        }

        return { base64Image, mediaType };
    } catch (error) {
        console.error('Error fetching or encoding image:', error);
        throw error;
    }
}

async function aIChatCompletion({
    userId = null,
    systemPrompt,
    userMessage = '',
    url = null,
    options = {},
    response_format = null,
}) {
    try {
        let messages = [];
        let requestPayload = {};
        let combinedMessage = `Instructions: ${systemPrompt}`;

        if (userMessage) {
            messages.push({ role: 'user', content: userMessage });
            combinedMessage += `, User Message: ${userMessage}`;
        }

        if (aiProvider === 'openai') {
            if (url) {
                messages.push({
                    role: 'user',
                    content: [
                        {
                            type: 'image_url',
                            image_url: { url: url },
                        },
                    ],
                });
            }

            messages.unshift({ role: 'system', content: systemPrompt });

            requestPayload = {
                model: 'gpt-4o',
                ...options,
                messages,
            };

            if (response_format) {
                requestPayload.response_format = response_format;
            }

            const response =
                await openai.chat.completions.create(requestPayload);
            const rawResponse = response.choices[0].message.content.trim();
            const totalText = `${systemPrompt}${rawResponse}`;
            await UserModel.addTokenCountToUserSubscription(userId, totalText);

            return rawResponse;
        } else if (aiProvider === 'anthropic') {
            if (url) {
                const { base64Image, mediaType } = await urlToBase64(url);

                messages = [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: mediaType,
                                    data: base64Image,
                                },
                            },
                            {
                                type: 'text',
                                text: combinedMessage,
                            },
                        ],
                    },
                ];
            } else {
                messages = [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: combinedMessage,
                            },
                        ],
                    },
                ];
            }

            requestPayload = {
                model: 'claude-3-5-sonnet-20240620',
                max_tokens: 4096,
                system: `You will be given instructions, take your time to consider the problem thoroughly. Evaluate all aspects and potential approaches.

                When you're ready to respond, follow these output formatting rules strictly:
                1. If asked to return code, provide only the code and nothing else.
                2. If asked to return a JSON object, provide only the JSON object and nothing else.
                3. If asked to return a single word, provide only that word and nothing else.

                Now provide your final response according to the guidelines specified in the problem. Make sure your response adheres strictly to the output formatting rules mentioned earlier.`,
                messages: messages,
            };

            const response = await anthropic.messages.create(requestPayload);
            const rawResponse = response.content[0].text.trim();
            const totalText = `${combinedMessage}${rawResponse}`;
            await UserModel.addTokenCountToUserSubscription(userId, totalText);

            return rawResponse;
        } else if (aiProvider === 'gemini') {
            const model = genAI.getGenerativeModel({
                model: 'gemini-1.5-pro-latest',
            });

            let prompt = combinedMessage;

            const result = await model.generateContent(prompt);
            const response = result.response;
            const rawResponse = response.text().trim();

            const totalText = `${combinedMessage}${rawResponse}`;
            await UserModel.addTokenCountToUserSubscription(userId, totalText);

            return rawResponse;
        } else {
            throw new Error('Invalid AI provider specified');
        }
    } catch (error) {
        console.error(`${aiProvider.toUpperCase()} API Error:`, error);
        return 'error';
    }
}

module.exports = aIChatCompletion;
