// require telegram bot library
const TL = require("node-telegram-bot-api");

// keyboards
const key = require("./src/keys");

// require database
require("./src/database");

// require Schemas
const video = require("./src/models/video");
const photo = require("./src/models/photo");

// random string func
const random = () => {
  return Math.random().toString(36).substr(2, 10);
};

// force join func
const isJoin = async (chid, usrid) => {
  try {
    let { status } = await bot.getChatMember(chid, usrid);
    return true ? status !== "left" : false;
  } catch (e) {
    return e;
  }
};

// setup datas
const username = ""; // => bot username without @
const token = ""; // => bot token
const chid = ""; // => channel id
const chlink = ""; // => channel link

// setup bot
const bot = new TL(token, {
  polling: true,
});

bot.onText(/\/start (.+)/, async (msg, match) => {
  try {
    let joined = await isJoin(chid, msg.from.id);
    if (joined) {
      photo.find({ id: match[1] }, async (err, data) => {
        if (err) console.log(err);
        if (data[0] !== undefined) {
          let { fileId } = data[0];
          await bot.sendPhoto(msg.chat.id, fileId);
        } else {
          await bot.sendMessage(msg.chat.id, "این فایل وجود ندارد");
        }
      });
    } else {
      await bot.sendMessage(
        msg.chat.id,
        "❖لطفا بعد از جوین شدن در کانال های زیر مجددا تلاش کنید",
        {
          reply_markup: {
            inline_keyboard: [key.channel("چنل اول", chlink), key.ozviat()],
          },
        }
      );
    }
  } catch (e) {
    console.log(e);
  }
});

bot.on("photo", async (msg) => {
  let id = random();
  let fileId =
    msg.photo[2].file_id || msg.photo[1].file_id || msg.photo[0].file_id;
  let file = new photo({
    id,
    fileId,
  });
  file.save(async (err) => {
    if (err) await bot.sendMessage(msg.chat.id, `به مشکل خوردم:\n${err}`);
    let link = `https://t.me/${username}?start=${id}`;
    await bot.sendMessage(msg.chat.id, `فایل شما ذخیره شد:\n${link}`);
  });
});
