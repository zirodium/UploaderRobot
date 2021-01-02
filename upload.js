// require telegram bot library
const TL = require('node-telegram-bot-api')

// keyboards
const key = require('./src/keys')

// require database
require('./src/database')

// require Schemas
const Video = require('./src/models/video')
const Photo = require('./src/models/photo')

// setup datas
const admins = []
const username = '' // => bot username without @
const token = '' // => bot token
const chid = '' // => channel id
const chlink = '' // => channel link

// setup bot
const bot = new TL(token, {
  polling: true
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
    const joined = await isJoin(chid, msg.from.id)
    if (joined) {
      Photo.find({ id: match[1] }, async (err, data) => {
        Video.find({ id: match[1] }, async (er, vid) => {
          if (er) console.log(er)
          if (err) console.log(err)
          if (data[0]) {
            const { fileId } = data[0]
            await bot.sendPhoto(msg.chat.id, fileId)
          } else if (vid[0]) {
            const { fileId } = vid[0]
            await bot.sendVideo(msg.chat.id, fileId)
          } else {
            await bot.sendMessage(msg.chat.id, 'این فایل وجود ندارد')
          }
        })
      })
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
    const id = random()
    const { file_id: fileId } = msg.photo[2] || msg.photo[1] || msg.photo[0]
    const File = new Photo({
      id,
      fileId
    })
    File.save(async (err) => {
      if (err) await bot.sendMessage(msg.chat.id, `به مشکل خوردم:\n${err}`)
      const link = `https://t.me/${username}?start=${id}`
      await bot.sendMessage(msg.chat.id, `فایل شما ذخیره شد:\n${link}`)
    })
  }
})

bot.on('video', async (msg) => {
  if (admins.includes(msg.from.id)) {
    const id = random()
    const { file_id: fileId } = msg.video
    const File = new Video({
      id,
      fileId
    })
    File.save(async (err) => {
      if (err) await bot.sendMessage(msg.chat.id, `به مشکل خوردم:\n${err}`)
      const link = `https://t.me/${username}?start=${id}`
      await bot.sendMessage(msg.chat.id, `فایل شما ذخیره شد:\n${link}`)
    })
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
