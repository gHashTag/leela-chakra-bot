import { GameStep, GameStepResultT } from "../types";
import { getAiFeedbackFromSupabase } from "./ai";
import { supabase } from "./index";

export async function gameStep({ roll, response, telegram_id }: GameStepResultT) {
    // Найти user_id по telegram_id
    const { data: userData, error: userError } = await supabase.from("users").select("user_id").eq("telegram_id", telegram_id).single();

    if (userError || !userData) {
        throw new Error(`${userError?.message}`);
    }

    const user_id = userData.user_id;

    const { data: stepData, error: stepError } = await supabase.functions.invoke("game-step", {
        body: JSON.stringify({
            roll: roll,
            result: [...response],
        }),
    });
    if (stepError) {
        throw stepError;
    }

    console.log(stepData, "stepData");

    // Внести объект stepData в таблицу game
    const { data: gameInfo, error: gameError } = await supabase.from("game").insert({
        user_id: user_id,
        roll: roll,
        loka: stepData.loka,
        previous_loka: stepData.previous_loka,
        direction: stepData.direction,
        consecutive_sixes: stepData.consecutive_sixes,
        position_before_three_sixes: stepData.position_before_three_sixes,
        is_finished: stepData.is_finished,
    });

    console.log(gameInfo, "gameInfo");
    if (gameError) {
        throw new Error(gameError.message);
    }

    console.log(stepData, "stepData");
    return stepData;
}

export async function getLastStep(user_id: string): Promise<GameStep> {
    // Проверить, существует ли user_id в таблице game
    const { data: userExists, error: userExistsError } = await supabase
        .from("game")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    if (userExistsError) {
        console.log(userExistsError, "userExistsError");
        if (!userExists) {
            return {
                loka: 1,
                direction: "step 🚶🏼",
                consecutive_sixes: 0,
                position_before_three_sixes: 0,
                is_finished: false,
            };
        }
    }

    // Если user_id найден, получить последний шаг
    const { data: lastStepData, error: lastStepError } = await supabase
        .from("game")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false })
        .limit(1);

    if (lastStepError) {
        throw new Error(lastStepError.message);
    }

    if (!lastStepData || lastStepData.length === 0) {
        return {
            loka: 1,
            direction: "step 🚶🏼",
            consecutive_sixes: 0,
            position_before_three_sixes: 0,
            is_finished: false,
        };
    }

    return lastStepData[0];
}

export async function updateHistory(user_id: string, username: string, language_code: string, content: string) {
    const language = language_code === "ru" ? "ru" : "en";
    const lastStep = await getLastStep(user_id);
    const lastPlan = await getPlan(lastStep.loka, language);
    const query = `the user must analyze this text: ${lastPlan}
  here is his analysis of the text: ${content}
  you need to respond in his language to his text analysis.`;
    const { ai_content } = await getAiFeedbackFromSupabase({
        query: query,
        username,
        language_code,
    });
    console.log(ai_content, "ai_content");
    console.log(lastStep, "lastStep");
    // Внести данные в таблицу history
    const { data, error } = await supabase.from("report").insert({
        user_id: user_id,
        username: username,
        language_code: language_code,
        content: content,
        ai_response: ai_content,
    });
    console.log(data, "data");
    if (error) {
        throw new Error(error.message);
    }

    return ai_content;
}

export async function getPlan(loka: number, language_code: string) {
    // Получить строку данных из таблицы по loka
    console.log(language_code, "language_code");
    const language = language_code === "ru" ? "ru" : "en";
    const name = language_code === "ru" ? "name_ru" : "name";
    const { data, error }: any = await supabase.from("plans").select(`short_desc_${language}, image, ${name}`).eq("loka", loka).single();

    if (error) {
        throw new Error(error.message);
    }

    console.log(data, "data");
    return {
        short_desc: data[`short_desc_${language_code}`],
        image: data.image,
        name: data[name],
    };
}

export async function getPlanByUserId(user_id: string, language_code: string) {
    const lastStep = await getLastStep(user_id);
    return await getPlan(lastStep.loka, language_code);
}
