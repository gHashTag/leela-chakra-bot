import { MiddlewareFn } from "grammy";
import { MyContextWithSession } from "../core/types";
import { createUser } from "../core/supabase/users";

export const customMiddleware: MiddlewareFn<MyContextWithSession> = async (ctx, next) => {
    const username = ctx.from?.username || "";
    const telegram_id = ctx.from?.id;

    if (telegram_id) {
        // Ваша логика здесь
        console.log(username, telegram_id, "username, telegram_id");
        await createUser(username, telegram_id.toString());
    }

    // Продолжаем выполнение следующих промежуточных обработчиков
    await next();
};
