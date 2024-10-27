import { Context, InlineKeyboard } from "grammy";

const step = async (ctx: Context): Promise<void> => {
    console.log("step");
    await ctx.replyWithChatAction("typing");
    const lang = ctx.from?.language_code === "ru";

    await ctx.reply(
        lang
            ? "🎲 Бросьте игральную кость, чтобы сделать ход и продвигаться дальше по пути самопознания 🕉️"
            : "🎲 Roll the dice to make a move and progress further on the path of self-discovery 🕉",
        {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🎲", callback_data: "make_step" }],
                    [{ text: "Gameboard", web_app: { url: "https://leela-chakra-nextjs.vercel.app/gameboard" } }],
                ],
            },
        },
    );
};

export default step;
