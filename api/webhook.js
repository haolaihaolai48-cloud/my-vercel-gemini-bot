// api/webhook.js

// Telegram Bot API နဲ့ Gemini SDK ကို ခေါ်ယူပါ
const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenAI } = require('@google/genai');

// Environment Variables ကနေ Token တွေကို ယူပါ
const BOT_TOKEN = process.env.BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Bot instance ကို Webhook mode အတွက် ဖန်တီးပါ
// **ဒီနေရာမှာ Polling ကို မသုံးပါ**
const bot = new TelegramBot(BOT_TOKEN);
const ai = new GoogleGenAI(GEMINI_API_KEY);

// Vercel Serverless Function ရဲ့ Default Export Function
module.exports = async (req, res) => {
    try {
        // Telegram က ပို့လိုက်တဲ့ update (JSON Data) ကို ရယူပါ
        const update = req.body;
        
        // update ကို bot instance ကို ပေးပို့လိုက်ပါ
        bot.processUpdate(update);

        // Telegram API က 200 OK ကို ချက်ချင်း လိုချင်တဲ့အတွက် Response ပြန်ပေးပါ
        res.status(200).send('OK');

    } catch (error) {
        console.error('Error processing update:', error.message);
        // Error ဖြစ်လည်း 200 OK ပဲ ပြန်ပေးလိုက်ပါ (Telegram က ခဏခဏ ပြန်မပို့အောင်)
        res.status(200).send('OK');
    }
};

// **သင်ရဲ့ Bot Logic ကို ဒီနေရာမှာ ထားပါ**
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        bot.sendMessage(chatId, "မင်္ဂလာပါ။ Gemini AI Bot ကို Vercel မှာ Deploy လုပ်ထားပါတယ်။ စကားစပြောနိုင်ပါပြီ။");
        return;
    }
    
    // **၁။ User ရဲ့ မေးခွန်းကို Gemini ကို ပို့ခြင်း**
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: text,
        });

        const replyText = response.text || "Sorry, I couldn't generate a response.";
        
        // **၂။ Gemini ရဲ့ အဖြေကို Telegram သို့ ပြန်ပို့ခြင်း**
        await bot.sendMessage(chatId, replyText);

    } catch (e) {
        console.error("Gemini API Error:", e.message);
        bot.sendMessage(chatId, "လောလောဆယ် AI ဝန်ဆောင်မှု အခက်အခဲ ရှိနေပါတယ်။ ခဏနေမှ ပြန်စမ်းပေးပါ။");
    }
});
