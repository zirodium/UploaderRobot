// require telegram bot library
const TL = require("node-telegram-bot-api");
const { chunk } = require("lodash");
const redis = require("redis");
const r = redis.createClient({ db: 3 });

// keyboards
const key = require("./src/keys");

// setup datas
const admins = [];
const username = ""; // => bot username without @
const token = ""; // => bot token
const chid = ""; // => channel id
const chlink = ""; // => channel link
const pubChnl = "" // => public channel
const pubChnlName = '' // => public channel name

// setup bot
const bot = new TL(token, {
  polling: true,
});

r.on("error", (err) => {
  console.error(err);
});

r.on("connect", async (err, res) => {
  err ? console.error(err) : r.sadd("admins", admins);
  r.smembers("admins", (err, res) => {
    if (err) console.error(err);
    console.log("admin list updated!");
            admins.push(...res)
  });
  r.hmset(
    "channel1",
    {
      id: chid,
      name: "چنل اول",
      link: chlink,
    },
    (err, res) => {}
  );
});

// random string func
const random = () => Math.random().toString(36).substr(2, 10);

// force join func
const isJoin = async (chid, usrid) => {
  const { status } = await bot.getChatMember(chid, usrid);
  return true ? status !== "left" : false;
};

bot.onText(/\/start (.+)/, async (msg, match) => {
  try {
    r.sadd("members", msg.from.id);
    const joined = await isJoin(chid, msg.from.id);
      const id = match[1];
      r.set(`file:${msg.from.id}`, id)
      if (joined){
      if (id.startsWith("ph")) {
        r.smembers("photos", async (err, result) => {
          if (err) console.error(err);
          let file = result
            .map((res) => JSON.parse(res))
            .find((f) => f.id === id);
          await bot.sendPhoto(msg.chat.id, file.file_id, {
            caption: file.caption,
	reply_markup: {
		inline_keyboard: [
			[{ text: pubChnlName, url: pubChnl }]
		]
	}
          });
        });
      } else if (id.startsWith("vi")) {
        r.smembers("videos", async (err, result) => {
          if (err) console.error(err);
          let file = result
            .map((res) => JSON.parse(res))
            .find((f) => f.id === id);
          await bot.sendVideo(msg.chat.id, file.file_id, {
            caption: file.caption,
	reply_markup: {
		inline_keyboard: [
			[{ text: pubChnlName, url: pubChnl }]
		]
	}
          });
        });
      } else {
        await bot.sendMessage(
          msg.chat.id,
          "ممکنه این فایل حذف شده باشه یا لینکی که استارت کردی اشتباه باشه"
        );
      }
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
  if (admins.includes(msg.from.id)) {
    try {
      const id = "ph" + random();
      const { file_id } = msg.photo[2] || msg.photo[1] || msg.photo[0];
      const caption = msg.caption || " ";
      r.sadd(
        "photos",
        JSON.stringify({
          id,
          file_id,
          caption,
        }),
        async (err, res) => {
          if (err) await bot.sendMessage(msg.chat.id, `Error: ${err}`);
          await bot.sendMessage(
            msg.chat.id,
            `فایل شما ذخیره شد:\nhttps://t.me/${username}?start=${id}`
          );
        }
      );
    } catch (e) {
      console.error(e);
    }
  }
});

bot.on("video", async (msg) => {
  if (admins.includes(msg.from.id)) {
    try {
      const id = "vi" + random();
      const { file_id } = msg.video;
      const caption = msg.caption || " ";
      r.sadd(
        "videos",
        JSON.stringify({
          id,
          file_id,
          caption,
        }),
        async (err, res) => {
          if (err) await bot.sendMessage(msg.chat.id, `Error: ${err}`);
          await bot.sendMessage(
            msg.chat.id,
            `فایل شما ذخیره شد:\nhttps://t.me/${username}?start=${id}`
          );
        }
      );
    } catch (e) {
      console.error(e);
    }
  }
});

bot.onText(/\/panel/, async (msg) => {
  try {
    if (admins.includes(msg.from.id)) {
      await bot.sendMessage(
        msg.chat.id,
        "به پنل مدیریت خوش اومدی",
        key.admin()
      );
    }
  } catch (e) {
    console.log(e.message);
  }
});

bot.on("message", async (msg) => {
  try {
    if (admins.includes(msg.from.id)) {
      r.get(`step:${msg.from.id}`, async (err, res) => {
        if (err) console.error(err);
        switch (res) {
          case "addAdmin":
            r.sadd("admins", msg.text);
            admins.push(msg.text)
            await bot.sendMessage(
              msg.chat.id,
              "ادمین جدید اضافه شد"
            );
            r.set(`step:${msg.from.id}`, "null");
            break;
          case "fwd":
            r.smembers("members", async (er, re) => {
              if (er) console.error(er);
              const chunked = chunk(re, 20);
              for (let i = 0; i < chunked.length; i++) {
                const item = chunked[i];
                setTimeout(() => {
                  item.forEach(async (userId) => {
                    try {
                      await bot.copyMessage(
                        userId,
                        msg.chat.id,
                        msg.message_id
                      );
                    } catch (e) {
                      r.sadd('usersBlockedBot', userId)
                      r.srem('members', userId)
                    }
                  });
                }, 1000 * i);
              }
              await bot.sendMessage(msg.chat.id, `پیام شما با موفقیت ارسال شد`);
              r.set(`step:${msg.from.id}`, "null");
              r.smembers('usersBlockedBot', async (e, u) => {
                  if (e) console.error(e);
                  await bot.sendMessage(msg.chat.id, `✅تعداد ${u.length || 0} کاربر رباتو بلاک کرده بودن که من اونارو از لیست ممبرا حذف کردم :)`)
              })
            });
            break;
        }
      });
    }
  } catch (e) {
    /* handle error */
    console.error(e);
  }
});

bot.on("callback_query", async (cb) => {
  try {
      const chatid = cb.message.chat.id;
      const msgid = cb.message.message_id;
      const from = cb.from.id;
      await bot.answerCallbackQuery(cb.id);
        /*
      r.smembers("admins", async (e, resp) => {
        if (e) console.error(e);
        if (resp.includes(cb.data)) {
          r.srem("admins", cb.data);
          await bot.editMessageText("ادمین حذف شد", key.back(chatid, msgid));
        }
      });*/
              let isJoined = await isJoin(chid, from)
if (cb.data == 'ozviat'){
              if (!isJoined){
                  await bot.sendMessage(chatid, 'شما هنوز توی چنلمون جوین نشدی\nبعد از جوین شدن روی دکمه عضو شدم کلیک کن', {
                      reply_markup: {
                          inline_keyboard: [key.channel("چنل اول", chlink), key.ozviat()]
                      }
                  })
              } else {
                  r.get(`file:${from}`, async (err, res) => {
                      if (err) console.error(err);
                      if (res.startsWith('ph')){
                          r.smembers('photos', async (er, re) => {
                              if (er) console.error(er);
                              let file = re.map(result => JSON.parse(result)).find(f => f.id === res)
                              await bot.sendPhoto(chatid, file.file_id, {
                                  caption: file.caption,
                                  reply_markup: {
                                      inline_keyboard: [
                                          [{
                                              text: pubChnlName,
                                              url: pubChnl
                                          }]
                                      ]
                                  }
                              })
                          })
                      } else if(res.startsWith('vi')){
                          r.smembers('videos', async (er, re) => {
                              if (er) console.error(er);
                              let file = re.map(result => JSON.parse(result)).find(f => f.id === res)
                              await bot.sendVideo(chatid, file.file_id, {
                                  caption: file.caption,
                                  reply_markup: {
                                      inline_keyboard: [
                                          [{
                                              text: pubChnlName,
                                              url: pubChnl
                                          }]
                                      ]
                                  }
                              })
                          })
                      } else {
                          await bot.sendMessage(chatid, "این فایل ممکنه اشتباه باشه یا حذف شده باشه")
                      }
                  })
              }
 }
    if (admins.includes(cb.from.id)) {
        switch(cb.data){
        case "amar":
          r.smembers("members", async (err, res) => {
            if (err) await bot.sendMessage(chatid, err);
            await bot.editMessageText(
              `☺امار ربات شما ${res.length} کاربر میباشد`,
              key.back(chatid, msgid)
            );
          });
          break;
        case "fwd":
          await bot.editMessageText(
            "پیامتونو بفرستید",
            key.back(chatid, msgid)
          );
          r.set(`step:${cb.from.id}`, "fwd");
          break;
        case "addAdmin":
          await bot.editMessageText(
            "یوزر ایدی ادمین جدید رو بفرست",
            key.back(chatid, msgid)
          );
          r.set(`step:${cb.from.id}`, "addAdmin");
          break;
        case "remAdmin":
          let adminData = [];
          r.smembers("admins", async (err, res) => {
            if (err) console.error(err);
            for (let i = 0; i < res.length; i++) {
              adminData.push(
                [
                  {
                    text: res[i],
                    callback_data: res[i],
                  },
                ],
                [
                  {
                    text: "➲ Back",
                    callback_data: "back",
                  },
                ]
              );
            }
            await bot.editMessageText("روی ادمینی که میخوای عزل شه کلیک کن", {
              chat_id: chatid,
              message_id: msgid,
              reply_markup: {
                inline_keyboard: adminData,
              },
            });
            r.set(`step:${cb.from.id}`, "remAdmin");
            adminData.length = 0;
          });
          break;
        case "back":
          await bot.editMessageText(
            "به پنل مدیریت خوش اومدی",
            key.adminBack(chatid, msgid)
          );
          r.set(`step:${cb.from.id}`, "null");
          break;
      }
    }
  } catch (e) {
    console.log(e.message);
  }
});
