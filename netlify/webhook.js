// netlify/functions/webhook.js

const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenAI } = require('@google/genai');

// Tokens များကို Environment Variables (Netlify Dashboard မှ) ယူပါ
const BOT_TOKEN = process.env.BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Webhook အတွက် Bot Instance ကို ဖန်တီးပါ
const bot = new TelegramBot(BOT_TOKEN);
const ai = new GoogleGenAI(GEMINI_API_KEY);

// Netlify Functions ရဲ့ Default Handler
exports.handler = async (event) => {
    // 1. Telegram က ပို့လိုက်တဲ့ JSON data ကို လက်ခံ
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    
    // Telegram က ပို့တဲ့ body ဟာ JSON string ဖြစ်နေတတ်လို့ parse လုပ်ရပါမယ်
    const update = JSON.parse(event.body);

    // 2. Bot ကို Process လုပ်ခိုင်းပါ
    bot.processUpdate(update);

    // 3. Telegram ကို 200 OK ပြန်ပေးပါ။ (Function ကို အမြန်ဆုံး အဆုံးသတ်ရပါမယ်)
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Processed update' }),
    };
};

// **Bot Logic ကို ဒီနေရာမှာ ထားပါ**
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        bot.sendMessage(chatId, "မင်္ဂလာပါ။ Gemini AI Bot ကို Netlify မှာ Deploy လုပ်ထားပါတယ်။ စကားစပြောနိုင်ပါပြီ။");
        return;
    }
    
    try {
        // Gemini API ကို ခေါ်ဆိုခြင်း
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: text,
        });

        const replyText = response.text || "Sorry, I couldn't generate a response.";
        
        // Telegram သို့ ပြန်ပို့ခြင်း
        await bot.sendMessage(chatId, replyText);

    } catch (e) {
        console.error("Gemini API Error:", e.message);
        bot.sendMessage(chatId, "AI ဝန်ဆောင်မှု အခက်အခဲ ရှိနေပါတယ်။");
    }
});
