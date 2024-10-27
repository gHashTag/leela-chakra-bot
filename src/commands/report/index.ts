import { getSupabaseUser, getUid, updateUser } from "../../core/supabase/users";
import { MyContext } from "../../core/types";
import { Conversation } from "@grammyjs/conversations";
import { updateHistory } from "../../core/supabase/game";

async function report(conversation: Conversation<MyContext>, ctx: MyContext) {
    console.log("report");
    const isRu = ctx.from?.language_code === "ru";

    // Ожидаем действия пользователя
    const { message } = await conversation.wait();
    await ctx.replyWithChatAction("typing");

    const report = message?.text ? message?.text : message?.caption;

    if (!report) return;
    if (report?.length < 50) {
        await ctx.reply(isRu ? "🔒 Отчёт должен быть <b>длиннее 50 символов</b>." : "🔒 Report must be <b>longer than 50 characters</b>.", {
            parse_mode: "HTML",
        });
        return;
    }

    const loader = await ctx.reply(isRu ? "🔮 Загрузка..." : "🔮 Loading...");
    const step_callback = {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎲", callback_data: `make_step` }],
                [{ text: "Gameboard", web_app: { url: `https://leela-chakra-nextjs.vercel.app/gameboard` } }],
            ],
        },
    };

    if (!ctx.from?.username) throw new Error("User not found");
    if (!ctx.chat?.id) throw new Error("Chat not found");
    const user_id = await getUid(ctx.from.username);
    if (!user_id) throw new Error("User not found");
    const response = await updateHistory(user_id, ctx.from.username || "", ctx.from.language_code || "ru", report);
    await updateUser(ctx.from.id.toString(), { isWrite: false });
    await ctx.reply(response, { parse_mode: "Markdown", ...step_callback });
    await ctx.api.deleteMessage(ctx.chat?.id, loader.message_id);
}

export { report };
