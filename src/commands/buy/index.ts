import { Context } from "grammy";

const buy = async (ctx: Context): Promise<void> => {
    const lang = ctx.from?.language_code === "ru";
    await ctx.reply(
        lang
            ? `<b>Ученик - 282⭐ в месяц</b>
   - Онлайн игра
   - Самостоятельное обучение в боте с доступом к обучающим материалам
   - ИИ гуру ассистент
   - Поддержка в чате

  <b>Эксперт - 1978⭐ в месяц</b>
   - Все, что в тарифе “Ученик“
   - Групповая онлайн игра с ведущим
   - Анализ индивидуального портрета

<b>Ментор - 19782⭐ в месяц</b>
   -Все, что в тарифе "Эксперт"
   - 4 индивидуальных игры с разбором целей
   - Личная поддержка в чате
   - Чек-лист и анализ игрока`
            : `<b>Student - 282⭐ per month</b>
   - Online game
   - Self-paced learning in the bot with access to educational materials
   - AI guru assistant
   - Chat support

  <b>Expert - 1978⭐ per month</b>
   - Everything in the "Student" plan
   - Group online game with a host
   - Individual portrait analysis

<b>Mentor - 19782⭐ per month</b>
   - Everything in the "Expert" plan
   - 4 individual games with goal analysis
   - Personal chat support
   - Checklist and player analysis`,
        {
            reply_markup: {
                inline_keyboard: [
                    [{ text: lang ? "Ученик" : "Student", callback_data: "buy_student" }],
                    [{ text: lang ? "Эксперт" : "Expert", callback_data: "buy_expert" }],
                    [{ text: lang ? "Ментор" : "Mentor", callback_data: "buy_mentor" }],
                ],
            },
            parse_mode: "HTML",
        },
    );
    return;
};

export default buy;
