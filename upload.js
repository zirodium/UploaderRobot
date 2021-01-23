// require telegram bot library
const TL = require('node-telegram-bot-api')
const { chunk } = require('lodash')
const redis = require('redis')
const r = redis.createClient()

// keyboards
const key = require('./src/keys')

// require database
//require('./src/database')

// require Schemas
//const Video = require('./src/models/video')
//const Photo = require('./src/models/photo')
//const Member = require('./src/models/member');

// setup datas
const admins = [1044952027]
const username = 'nodenlpbot' // => bot username without @
const token = '1478531064:AAG87eC08hBcYKh3wC-kQrU71lmBY2nZjYg' // => bot token
const chid = '-1001491974960' // => channel id
const chlink = 'https://t.me/joinchat/WO27MPvl4_waFtiq' // => channel link

// setup bot
const bot = new TL(token, {
  polling: true
})

r.on('error', err => {
    console.error(err);
})
r.on('connect', async (err, res) => {
    err ? console.error(err) : r.sadd('admins', admins)
    r.smembers('admins', (err, res) => {
        if (err) console.error(err);
        console.log('admin list updated!');
        admins.push(...res)
    })
    r.hmset('channel1', {
        id: chid,
        name: 'چنل اول',
        link: chlink
    }, (err, res) => {

    })
})

// random string func
const random = () => Math.random().toString(36).substr(2, 10)

// force join func
const isJoin = async (chid, usrid) => {
  const { status } = await bot.getChatMember(chid, usrid)
  return true ? status !== 'left' : false
}

bot.onText(/\/start (.+)/, async (msg, match) => {
  try {
      r.sadd('members', msg.from.id)
   // new Member({
   //     id: msg.from.id,
   //     firstname: msg.from.first_name,
   //     username: msg.from.username
   // }).save()
    const joined = await isJoin(chid, msg.from.id)
    if (joined) {
        const id = match[1]
        if (id.startsWith('ph')){
            r.smembers('photos', async (err,result) => {
                if (err) console.error(err);
                let file = result.map(res => JSON.parse(res)).find(f => f.id === id)
                await bot.sendPhoto(msg.chat.id, file.file_id, {
                    caption: file.caption
                })
            })
        } else if(id.startsWith('vi')){
            r.smembers('videos', async (err, result) => {
                if (err) console.error(err);
                let file = result.map(res => JSON.parse(res)).find(f => f.id === id)
                await bot.sendVideo(msg.chat.id, file.file_id, {
                    caption: file.caption
                })
            })
        } else {
            await bot.sendMessage(msg.chat.id, "ممکنه این فایل حذف شده باشه یا لینکی که استارت کردی اشتباه باشه")
        }
      //Photo.find({ id: match[1] }, async (err, data) => {
      //  Video.find({ id: match[1] }, async (er, vid) => {
      //    if (er) console.log(er)
      //    if (err) console.log(err)
      //    if (data[0]) {
      //      const { fileId } = data[0]
      //      await bot.sendPhoto(msg.chat.id, fileId)
      //    } else if (vid[0]) {
      //      const { fileId } = vid[0]
      //      await bot.sendVideo(msg.chat.id, fileId)
      //    } else {
      //      await bot.sendMessage(msg.chat.id, 'این فایل وجود ندارد')
      //    }
      //  })
      //})
    } else {
      await bot.sendMessage(
        msg.chat.id,
        '❖لطفا بعد از جوین شدن در کانال های زیر مجددا تلاش کنید',
        {
          reply_markup: {
            inline_keyboard: [key.channel('چنل اول', chlink), key.ozviat()]
          }
        }
      )
    }
  } catch (e) {
    console.log(e)
  }
})

bot.on('photo', async (msg) => {
  if (admins.includes(msg.from.id)) {
      try {
    const id = 'ph'+random()
    const { file_id } = msg.photo[2] || msg.photo[1] || msg.photo[0]
    const caption = msg.caption || ''
    r.sadd('photos', JSON.stringify({
        id,
        file_id,
        caption
    }), async (err, res) => {
        if (err) await bot.sendMessage(msg.chat.id, `Error: ${err}`)
        await bot.sendMessage(msg.chat.id, `فایل شما ذخیره شد:\nhttps://t.me/${username}?start=${id}`)
    })
    //const File = new Photo({
    //  id,
    //  fileId
    //})
    //File.save(async (err) => {
    //  if (err) await bot.sendMessage(msg.chat.id, `به مشکل خوردم:\n${err}`)
    //  const link = `https://t.me/${username}?start=${id}`
    //  await bot.sendMessage(msg.chat.id, `فایل شما ذخیره شد:\n${link}`)
    //})
    } catch(e){
        console.error(e);
    }
  }
})

bot.on('video', async (msg) => {
  if (admins.includes(msg.from.id)) {
      try {
          const id = 'vi'+random()
          const { file_id } = msg.video
          const caption = msg.caption || ''
          r.sadd('videos', JSON.stringify({
              id,
              file_id,
              caption
          }), async (err, res) => {
              if (err) await bot.sendMessage(msg.chat.id, `Error: ${err}`)
              await bot.sendMessage(msg.chat.id, `فایل شما ذخیره شد:\nhttps://t.me/${username}?start=${id}`)
          })
    //const File = new Video({
    //  id,
    //  fileId
    //})
    //File.save(async (err) => {
    //  if (err) await bot.sendMessage(msg.chat.id, `به مشکل خوردم:\n${err}`)
    //  const link = `https://t.me/${username}?start=${id}`
    //  await bot.sendMessage(msg.chat.id, `فایل شما ذخیره شد:\n${link}`)
    //})
   } catch(e){
     console.error(e)
    }
  }
})

bot.onText(/\/panel/, async (msg) => {
  try {
    if (admins.includes(msg.from.id)) {
      await bot.sendMessage(msg.chat.id, 'به پنل مدیریت خوش اومدی', key.admin())
    }
  } catch (e) {
    console.log(e.message)
  }
})

bot.on('message', async msg => {
    try {
        if (admins.includes(msg.from.id)) {
            r.get(`step:${msg.from.id}`, async (err,res) => {
                if (err) console.error(err);
                switch(res){
                    case 'fwd':
                        r.smembers('members', async (er, re) => {
                            if (er) console.error(er);
                            const chunked = chunk(re, 10)
                            for (let i = 0; i < chunked.length; i++) {
                                const item = chunked[i]
                                setTimeout(() => {
                                    item.forEach(async userId => {
                                        try {
                                        await bot.copyMessage(userId, msg.chat.id, msg.message_id)
                                        } catch(e){
                                            console.error(e);
                                        }
                                    })
                                }, 1000 * i)
                            }
                            await bot.sendMessage(msg.chat.id, `پیام شما با موفقیت ارسال شد`)
                            r.set(`step:${msg.from.id}`, 'null')
                        })
                        break;
                }
            })
        }
    } catch (e) {
        /* handle error */
        console.error(e);
    }
})

bot.on('callback_query', async cb => {
    try {
        if (admins.includes(cb.from.id)){
            const chatid = cb.message.chat.id
            const msgid = cb.message.message_id
            await bot.answerCallbackQuery(cb.id)
            switch (cb.data) {
                case 'amar':
                    r.smembers('members', async (err, res) => {
                        if (err) await bot.sendMessage(chatid, err)
                        await bot.editMessageText(`🍪امار ربات شما ${res.length} کاربر میباشد`, key.back(chatid, msgid))
                    })
                    break;
                case 'fwd':
                    await bot.editMessageText('پیامتونو بفرستید', key.back(chatid, msgid))
                    r.set(`step:${cb.from.id}`, 'fwd')
                    break;
                case 'addAdmin':
                    await bot.editMessageText('یوزر ایدی ادمین جدید رو بفرست', key.back(chatid, msgid))
                    r.set(`step:${cb.from.id}`, 'addAdmin')
                    break;
                case 'remAdmin':
                    let adminData = []
                    r.smembers('admins', async (err, res) => {
                        if (err) console.error(err);
                        for (let i of res) {
                            adminData.push([{
                                text: i,
                                callback_data: i
                            }],[{
                                text: "➲ Back",
                                callback_data: "back"
                            }])
                        }
                        await bot.editMessageText('روی ادمینی که میخوای عزل شه کلیک کن', {
                            chat_id: chatid,
                            message_id: msgid,
                            reply_markup: {
                                inline_keyboard: adminData
                            }
                        })
                        r.set(`step:${cb.from.id}`, 'remAdmin')
                        adminData = []
                    })
                    break;
                case 'back':
                    await bot.editMessageText('به پنل مدیریت خوش اومدی', key.adminBack(chatid, msgid))
                    r.set(`step:${cb.from.id}`, 'null')
                    break;
            }
        }
    } catch (e) {
        console.log(e.message);
    }
})
