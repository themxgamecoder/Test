const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Bot token directly here (as requested)
const token = '8076375530:AAF4MV5hLDDQmwfh4I8FIH6Z4O9sDolqByA';
const bot = new TelegramBot(token, { polling: true });

// Link map
const sources = {
  strong: 'https://mx-credsjson-wsbw.onrender.com/code',
  not_strong: 'https://mega-js-pair-code.onrender.com/code',
  third: 'https://mx-web-pair-jmwt.onrender.com/code'
};

// Store user choices
const userStates = new Map();

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, `👋 Welcome to the WhatsApp Pairing Bot!\nUse /pair to generate your code.`);
});

bot.onText(/\/pair/, (msg) => {
  const chatId = msg.chat.id;
  userStates.delete(chatId); // reset state

  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ Recommended (Strong)", callback_data: 'strong' },
          { text: "⚠️ Recommended (Not Strong)", callback_data: 'not_strong' }
        ],
        [
          { text: "📦 Third Option", callback_data: 'third' }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, 'Select a code source:', options);
});

bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const sourceKey = query.data;

  if (!sources[sourceKey]) {
    return bot.sendMessage(chatId, '❌ Invalid option selected.');
  }

  userStates.set(chatId, { source: sourceKey });

  bot.sendMessage(chatId, `📲 Send your WhatsApp number (e.g. 234XXXXXXXXXX):`);
  bot.answerCallbackQuery(query.id);
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Ignore commands
  if (text.startsWith('/')) return;

  const state = userStates.get(chatId);
  if (!state || !state.source) return;

  // Validate number
  if (!/^\d{10,15}$/.test(text)) {
    return bot.sendMessage(chatId, `❌ Invalid number. Please send only digits (e.g. 234XXXXXXXXXX)`);
  }

  const selectedURL = sources[state.source];
  userStates.delete(chatId); // clear state

  bot.sendMessage(chatId, `⏳ Generating your code from selected source...`);

  try {
    const response = await axios.get(`${selectedURL}/${text}`);
    const code = response.data?.code || response.data;

    bot.sendMessage(chatId, `✅ Your Code from ${selectedURL}:\n\n${code}`);
  } catch (err) {
    bot.sendMessage(chatId, `❌ Failed to get code from selected source. Please try again.`);
  }
});
