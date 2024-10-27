import { CheckAndReturnUserResult, CheckUsernameCodesResult, SupabaseResponse, SupabaseUser, UserContext, UserData, UserWithFullName } from "../types/index";
import { supabase } from "./index";

export const createUser = async (username: string, telegram_id: string) => {
    // Проверяем, существует ли пользователь с данным telegram_id
    const { data: existingUser, error } = await supabase.from("users").select("username").eq("telegram_id", telegram_id).maybeSingle();

    if (error) {
        // Если произошла ошибка при запросе, выбрасываем её
        throw new Error(`Ошибка при проверке существующего пользователя: ${error.message}`);
    }

    if (existingUser) {
        // Если пользователь существует, проверяем, совпадает ли username
        if (existingUser.username !== username) {
            // Если username отличается, обновляем его
            const { error: updateError } = await supabase.from("users").update({ username }).eq("telegram_id", telegram_id);

            if (updateError) {
                // Если произошла ошибка при обновлении, выбрасываем её
                throw new Error(`Ошибка при обновлении пользователя: ${updateError.message}`);
            }
        }
    } else {
        // Если пользователь не существует, создаем новую запись
        const { error: insertError } = await supabase.from("users").insert({ username, telegram_id });

        if (insertError) {
            // Если произошла ошибка при вставке, выбрасываем её
            throw new Error(`Ошибка при добавлении пользователя: ${insertError.message}`);
        }
    }
};

export async function checkAndUpdate(ctx: any): Promise<void> {
    try {
        const { first_name, last_name, username, chat_id } = ctx.from;
        const telegram_id = ctx.from.id.toString();
        const { user } = await checkAndReturnUser(telegram_id);

        if (!user) return;

        const updates: any = {};
        if (user.first_name !== first_name) updates.first_name = first_name;
        if (user.last_name !== last_name) updates.last_name = last_name;
        if (user.username !== username) updates.username = username;
        if (user.chat_id !== chat_id) updates.chat_id = chat_id;

        if (Object.keys(updates).length > 0) {
            console.log(updates, "updates");
            const { error } = await supabase.from("users").update(updates).eq("telegram_id", telegram_id);

            if (error) {
                throw new Error("Error updating user: " + error.message);
            }
        }
    } catch (error) {
        throw new Error("Error checkAndUpdate: " + error);
    }
}

export async function updateUser(telegram_id: string, updates: any): Promise<void> {
    try {
        const { data, error } = await supabase.from("users").update(updates).eq("telegram_id", telegram_id).select("*"); // Добавлено .select("*")

        if (error) {
            throw new Error("Error updating user: " + error.message);
        }

        if (!data) {
            throw new Error("No data returned from update");
        }
    } catch (error) {
        throw new Error("Error updateUser: " + error);
    }
}

export const setLanguage = async (telegram_id: string, language_code: string): Promise<SupabaseUser[][]> => {
    try {
        const { data, error }: SupabaseResponse<SupabaseUser[]> = await supabase
            .from("users")
            .update({ language_code })
            .eq("telegram_id", telegram_id)
            .select("*");

        console.log(data, "data setLanguage");
        if (error) {
            throw new Error("Error setLanguage: " + error);
        }

        return data || [];
    } catch (error) {
        throw new Error("Error setLanguage: " + error);
    }
};

export async function getLanguage(telegram_id: string): Promise<string | null> {
    try {
        console.log("telegram_id", telegram_id);
        const { data, error } = await supabase.from("users").select("language_code").eq("telegram_id", telegram_id).single();

        console.log(data, "data getLanguage");
        if (error) {
            return null;
        }

        return data?.language_code || null;
    } catch (error) {
        console.log(error, "error getLanguage");
        throw new Error("Error getLanguage: " + error);
    }
}

export const getSupabaseUser = async (telegram_id: string): Promise<SupabaseUser | null> => {
    try {
        const response = await supabase.from("users").select("*").eq("telegram_id", telegram_id).single();

        if (response.error && response.error.code === "PGRST116") {
            console.error("getSupabaseUser: User not found");
            return null;
        }

        if (response.error) {
            console.error("Error getting user information:", response.error);
            return null;
        }

        return response.data;
    } catch (error) {
        throw new Error("Error getSupabaseUser: " + error);
    }
};

export const createUserInDatabase = async (newUser: SupabaseUser): Promise<SupabaseUser | null> => {
    try {
        await supabase.from("users").insert([newUser]);
        const user = await getSupabaseUser(newUser.username || "");
        // console.log(user, "user");
        return user;
    } catch (error) {
        throw new Error("Error createUserInDatabase: " + error);
    }
};

export async function getUid(username: string): Promise<string | null> {
    try {
        // Запрос к таблице users для получения user_id по username
        const response = await supabase.from("users").select("user_id").eq("username", username).single();

        if (response.error) {
            throw new Error("Error getUid: " + response.error.message);
        }

        if (!response.data) {
            console.error("User not found");
            return null; // или выбросить ошибку, если пользователь должен существовать
        }

        // Возвращаем user_id
        return response.data.user_id;
    } catch (error) {
        throw new Error("Error getUid: " + error);
    }
}

export const getUser = async (username: string): Promise<UserWithFullName> => {
    try {
        const response = await supabase.from("users").select("*").eq("username", username);

        if (response.error) {
            throw new Error("Error getUser: " + response.error.message);
        }

        return {
            data: response.data[0],
            position: response.data[0].position,
            designation: response.data[0].designation,
            full_name: `${response.data[0].first_name} ${response.data[0].last_name}`,
        };
    } catch (error) {
        throw new Error("Error getUser: " + error);
    }
};

export const checkUsername = async (username: string): Promise<boolean> => {
    try {
        const response: SupabaseResponse<SupabaseUser[]> = await supabase.from("users").select("*").eq("username", username);

        if (response.error) {
            console.error(response.error, "error checkUsername");
            return false;
        }

        return response.data ? response.data.length > 0 : false;
    } catch (error) {
        throw new Error("Error checkUsername: " + error);
    }
};

export const checkUsernameAndReturnUser = async (username: string): Promise<CheckAndReturnUserResult> => {
    try {
        const response = await supabase.from("users").select("*").eq("username", username);

        if (response.error) {
            console.error(response.error, "error checkUsername");
            return {
                isUserExist: false,
                user: null,
            };
        }

        return {
            isUserExist: response.data ? response.data.length > 0 : false,
            user: response.data ? response.data[0] : null,
        };
    } catch (error) {
        throw new Error("Error checkUsernameAndReturnUser: " + error);
    }
};

export async function checkAndReturnUser(telegram_id: string): Promise<{ isUserExist: boolean; user: SupabaseUser | null }> {
    try {
        const response = await supabase.from("users").select("*").eq("telegram_id", telegram_id);

        if (response.error) {
            // console.log(response.error, "error checkUsername");
            return {
                isUserExist: false,
                user: null,
            };
        }

        const user = response.data && response.data.length > 0 ? response.data[0] : null;

        return {
            isUserExist: user !== null,
            user,
        };
    } catch (error) {
        throw new Error("Error checkAndReturnUser: " + error);
    }
}

export const checkUsernameCodes = async (username: string): Promise<CheckUsernameCodesResult> => {
    try {
        console.log("checkUsernameCodes username🤩", username);
        const { data: userData, error: userError } = await supabase.from("users").select("*").eq("username", username);

        const { data: rooms, error: roomsError } = await supabase.from("rooms").select("*").eq("username", username);

        if (roomsError) {
            throw new Error("(246)Error checkUsernameCodes: " + roomsError);
        }
        const invitation_codes = rooms && rooms[0]?.codes;

        if (userError || !userData) {
            return {
                isInviterExist: false,
                invitation_codes: "",
                error: true,
                inviter_user_id: "",
            };
        }

        return {
            isInviterExist: userData && userData.length > 0,
            invitation_codes,
            error: false,
            inviter_user_id: userData ? userData[0].user_id : "",
        };
    } catch (error) {
        throw new Error("(266)Error checkUsernameCodes: " + error);
    }
};

export const setSelectedIzbushka = async (username: string, select_izbushka: string): Promise<SupabaseUser[][]> => {
    try {
        const { data, error }: SupabaseResponse<SupabaseUser[]> = await supabase.from("users").update({ select_izbushka }).eq("username", username).select("*");

        if (error) {
            throw new Error("Error setSelectedIzbushka: " + error);
        }

        return data || [];
    } catch (error) {
        throw new Error("Error setSelectedIzbushka: " + error);
    }
};

export const setMarketplace = async (username: string, marketplace: string) => {
    try {
        const { data, error } = await supabase.from("users").update({ marketplace }).eq("username", username);
    } catch (error) {
        throw new Error("Error setMarketplace: " + error);
    }
};

export const getMarketplace = async (username: string) => {
    try {
        const { data: marketplace, error } = await supabase.from("users").select("marketplace").eq("username", username);

        if (error || !marketplace) {
            throw new Error("Error getMarketplace: " + error);
        }

        return marketplace[0].marketplace;
    } catch (error) {
        throw new Error("Error getMarketplace: " + error);
    }
};
