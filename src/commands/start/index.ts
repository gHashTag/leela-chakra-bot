import { Context } from "grammy";

const start = async (ctx: Context): Promise<void> => {
    await ctx.replyWithChatAction("typing");
    const lang = ctx.from?.language_code === "ru";
    await ctx.reply(
        lang
            ? `🔮 Добро пожаловать в игру самопознания "Лила Чакра", ${ctx.from?.first_name}! 🔮\n\n🌟 В этой увлекательной игре ты отправишься в захватывающее путешествие через чакры, открывая тайны и возможности, скрытые внутри тебя.\n\n💫 Готов ли ты погрузиться в мир духовного роста, встретить свое истинное "Я" и раскрыть потенциал своих энергетических центров? С "Лилой Чакра" ты сможешь узнать глубже себя, обрести гармонию и понимание своего внутреннего мира.\n\n🔮 Пусть каждое испытание в игре принесет тебе новое понимание, мудрость и вдохновение. Дерзай и открой двери своего подсознания, исследуя таинственные чакры и обретая внутреннюю гармонию!`
            : `🔮 Welcome to the Leela Chakra Self-Discovery Game, ${ctx.from?.first_name}! 🔮\n\n🌟 In this exciting game, you will embark on an exciting journey through the chakras, discovering the secrets and possibilities hidden within you.\n\n💫 Are you ready to dive into the world of spiritual growth, meet your true self and unlock the potential of your energy centers? With "Leela Chakra" you can learn more about yourself, find harmony and understanding of your inner world.\n\n🔮 May each challenge in the game bring you new insights, wisdom and inspiration. Dare to open the doors of your subconscious mind, exploring the mysterious chakras and finding inner harmony!`,
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        // { text: lang ? "Начать тест" : "Start test", callback_data: "leelachakra_01_01" },
                        { text: lang ? "Начать игру" : "Start game", callback_data: "make_step" },
                    ],
                ],
            },
        },
    );
};

export default start;
