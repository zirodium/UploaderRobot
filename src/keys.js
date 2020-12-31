class Keyboards {
  admin() {
    return {
      reply_markup: {
        inline_keyboard: [
          [{ text: "› امار ‹", callback_data: "amar" }],
          [{ text: "› فایل ها ‹", callback_data: "files" }],
          [{ text: "› ارسال همگانی ‹", callback_data: "fwd" }],
          [{ text: "› افزودن ادمین ‹", callback_data: "addAdmin" }],
          [{ text: "› حذف ادمین ‹", callback_data: "remAdmin" }],
          [{ text: "› لیست ادمین ها ‹", callback_data: "listAdmin" }],
        ],
      },
    };
  }
  back(chatId, msgId) {
    return {
      chat_id: chatId,
      message_id: msgId,
      reply_markup: {
        inline_keyboard: [[{ text: "➲ Back", callback_data: "back" }]],
      },
    };
  }
  adminBack(chatId, msgId) {
    return {
      chat_id: chatId,
      message_id: msgId,
      reply_markup: {
        inline_keyboard: [
          [{ text: "› امار ‹", callback_data: "amar" }],
          [{ text: "› فایل ها ‹", callback_data: "files" }],
          [{ text: "› ارسال همگانی ‹", callback_data: "fwd" }],
          [{ text: "› افزودن ادمین ‹", callback_data: "addAdmin" }],
          [{ text: "› حذف ادمین ‹", callback_data: "remAdmin" }],
          [{ text: "› لیست ادمین ها ‹", callback_data: "listAdmin" }],
        ],
      },
    };
  }
  channel(chname, chlink) {
    return [{ text: chname, url: chlink }];
  }
  ozviat() {
    return [{ text: "عضو شدم", callback_data: "ozviat" }];
  }
}
module.exports = new Keyboards();
