require("dotenv").config();

import { Bot, session } from "grammy";
import commands from "./commands";
import { gameStep, getLastStep, getPlan } from "./core/supabase/game";
import { checkSubscriptionByTelegramId, sendPaymentInfo } from "./core/supabase/payments";
import { getSupabaseUser, getUid, updateUser } from "./core/supabase/users";
import { development, production } from "./utils/launch";
import { conversations, createConversation } from "@grammyjs/conversations";
import { MyContextWithSession } from "./core/types";
import { customMiddleware } from "./utils/middleware";
import { report } from "./commands/report";

const bot = new Bot<MyContextWithSession>(process.env.BOT_TOKEN || "");

bot.use(session({ initial: () => ({}) }));
bot.api.setMyCommands([
    {
        command: "start",
        description: "👋 Начать использовать бота",
    },
    {
        command: "/step",
        description: "Make a step",
    },
    {
        command: "/buy",
        description: "Buy a plan",
    },
]);

bot.use(conversations());
bot.use(createConversation(report));
bot.use(customMiddleware);
bot.use(commands);

bot.on("pre_checkout_query", (ctx) => {
    ctx.answerPreCheckoutQuery(true);
    return;
});

bot.on("message:successful_payment", async (ctx) => {
    const lang = ctx.from?.language_code === "ru";
    if (!ctx.from?.username) throw new Error("User not found");
    const textToPost = "🙏🏻 Namaste";
    await ctx.reply(lang ? "🤝 Спасибо за покупку!" : "🤝 Thank you for the purchase!");
    const user_id = await getUid(ctx.from?.username);
    if (!user_id) throw new Error("User not found");
    await sendPaymentInfo(user_id, ctx.message.successful_payment.invoice_payload);
    await ctx.api.sendMessage("-1002090264748", textToPost);
    return;
});

bot.on("callback_query:data", async (ctx) => {
    console.log(ctx.callbackQuery.data, "callback_query:data");
    await ctx.replyWithChatAction("typing");
    console.log(ctx);
    const callbackData = ctx.callbackQuery.data;
    const lang = ctx.from?.language_code === "ru";

    const subscription = await checkSubscriptionByTelegramId(ctx.from?.id.toString());
    if (callbackData.startsWith("make_step")) {
        console.log("step...");
        const roll = Math.floor(Math.random() * 6) + 1; // Получаем значение кубика от 1 до 6

        const user = await getSupabaseUser(ctx.from?.id.toString());
        if (subscription === "unsubscribed") {
            if (user?.first_request) {
                await ctx.reply(
                    lang
                        ? "🔒 Вы не подписаны на какой-либо уровень. Подписка неактивна. \n\n/buy - выбери уровень и оформляй подписку"
                        : "🔒 You are not subscribed to any level. The subscription is inactive. \n\n/buy - select a level and subscribe",
                );
                return;
            }
        }
        if (!user) return;
        if (user.isWrite) {
            console.log("user.isWrite 305", user.isWrite);
            const user_id = await getUid(ctx.from?.username || "");
            if (!user_id) throw new Error("User not found");
            const step = await getLastStep(user_id.toString());
            console.log("step 305", step);
            if (!step) return;
            console.log("don't return 305");
            const plan = await getPlan(step.loka, lang ? "ru" : "en");
            const directionMap: { [key: string]: { ru: string; en: string } } = {
                "stop 🛑": { ru: "Стоп 🛑", en: "Stop 🛑" },
                "arrow 🏹": { ru: "Стрела 🏹", en: "Arrow 🏹" },
                "snake 🐍": { ru: "Змея 🐍", en: "Snake 🐍" },
                "win 🕉": { ru: "Победа 🕉", en: "Win 🕉" },
                "step 🚶🏼": { ru: "Шаг 🚶🏼", en: "Step 🚶🏼" },
            };

            const stepDirection = directionMap[step.direction][lang ? "ru" : "en"];
            const text = lang
                ? `<b>🔮 Вы стоите на плане ${step.loka} - ${plan.name} - ${stepDirection}</b>
    
    <i>📜 Прочитайте план, напишите отчет, и получите духовную мудрость от гуру ИИ🤖</i>
    
    ${plan.short_desc}
    
    <b>‼️ Для написания отчета обязательно ответьте на это сообщение, иначе игра не продолжится.</b>`
                : `<b>🔮 You are standing on plan ${step.loka} - ${plan.name} - ${stepDirection}</b>
    
    <i>📜 Read the plan, write a report, and receive spiritual wisdom from the AI guru 🤖</i>
    
    ${plan.short_desc}
    
    <b>‼️ To write the report, you must reply to this message, otherwise the game will not continue.</b>`;
            if (plan.image) {
                await ctx.replyWithPhoto(plan.image, { caption: text, parse_mode: "HTML", reply_markup: { force_reply: true } });
                console.log("wait report");
                await ctx.conversation.enter("report");
                return;
            }
            await updateUser(ctx.from.id.toString(), { first_request: true });
            await ctx.reply(text, { parse_mode: "HTML" });
            console.log("wait report");
            await ctx.conversation.enter("report");
            return;
        }
        if (!ctx.from?.id) throw new Error("Telegram id not found");
        const user_id = await getUid(ctx.from?.username || "");
        if (!user_id) throw new Error("User not found");
        const lastStep = await getLastStep(user_id.toString());
        const step = await gameStep({ roll: roll, response: [lastStep], telegram_id: ctx.from?.id.toString() });
        console.log("step", step);
        if (!ctx.from.language_code) throw new Error("Language code not found");
        const plan = await getPlan(step.loka, ctx.from.language_code);
        console.log(plan, "plan");
        const directionMap: { [key: string]: { ru: string; en: string } } = {
            "stop 🛑": { ru: "Стоп 🛑", en: "Stop 🛑" },
            "arrow 🏹": { ru: "Стрела 🏹", en: "Arrow 🏹" },
            "snake 🐍": { ru: "Змея 🐍", en: "Snake 🐍" },
            "win 🕉": { ru: "Победа 🕉", en: "Win 🕉" },
            "step 🚶🏼": { ru: "Шаг 🚶🏼", en: "Step 🚶🏼" },
        };

        const stepDirection = directionMap[step.direction][lang ? "ru" : "en"];
        const text = lang
            ? `<b>🔮 Вы перешли на план ${step.loka}, выбросив на кубике ${roll} - ${plan.name} - ${stepDirection}</b>
    
    <i>📜 Прочитайте план, напишите отчет, и получите духовную мудрость от гуру ИИ🤖</i>
    
    ${plan.short_desc}
    
    <b>‼️ Для написания отчета обязательно ответьте на это сообщение, иначе игра не продолжится.</b>`
            : `<b>🔮 You have moved to plan ${step.loka}, rolling a ${roll} on the dice - ${plan.name} - ${stepDirection}</b>
    
    <i>📜 Read the plan, write a report, and receive spiritual wisdom from the AI guru 🤖</i>
    
    ${plan.short_desc}
    
    <b>‼️ To write the report, you must reply to this message, otherwise the game will not continue.</b>`;
        if (plan.image) {
            await ctx.replyWithPhoto(plan.image, { caption: text, parse_mode: "HTML", reply_markup: { force_reply: true } });
            console.log("wait report");
            await ctx.conversation.enter("report");
            return;
        }
        await ctx.reply(text, { parse_mode: "HTML", reply_markup: { force_reply: true } });
        await updateUser(ctx.from.id.toString(), { isWrite: true, first_request: true });
        console.log("wait report");
        await ctx.conversation.enter("report");
        return;
    }
    if (callbackData.startsWith("buy")) {
        if (callbackData.endsWith("student")) {
            await ctx.replyWithInvoice(
                lang ? "Ученик" : "Student",
                lang ? "Вы получите подписку уровня 'Ученик'" : "You will receive a subscription to the 'Student' level",
                "student",
                "XTR", // Используйте валюту Telegram Stars
                [{ label: "Цена", amount: 282 }],
            );
            return;
        }
        if (callbackData.endsWith("expert")) {
            await ctx.replyWithInvoice(
                lang ? "Эксперт" : "Expert",
                lang ? "Вы получите подписку уровня 'Эксперт'" : "You will receive a subscription to the 'Expert' level",
                "expert",
                "XTR", // Используйте валюту Telegram Stars
                [{ label: "Цена", amount: 1978 }],
            );
            return;
        }
        if (callbackData.endsWith("mentor")) {
            await ctx.replyWithInvoice(
                lang ? "Ментор" : "Mentor",
                lang ? "Вы получите подписку уровня 'Ментор'" : "You will receive a subscription to the 'Mentor' level",
                "mentor",
                "XTR", // Используйте валюту Telegram Stars
                [{ label: "Цена", amount: 19782 }],
            );
            return;
        }
    }
});
process.env.NODE_ENV === "development" ? development(bot) : production(bot);

export {};
