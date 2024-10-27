import { openai } from "../openai";
import { getAiSupabaseFeedbackT } from "../types";
import { supabase, supabaseSQL } from "./index";

const model_ai = "gpt-4o";

type getCompletionT = {
    prompt: string;
    assistantPrompt: string;
    systemPrompt: string;
};
export const getCompletion = async ({ prompt, assistantPrompt, systemPrompt }: getCompletionT) => {
    try {
        const response = await openai.chat.completions.create({
            model: model_ai,
            messages: [
                { role: "user", content: prompt },
                { role: "assistant", content: assistantPrompt },
                { role: "system", content: systemPrompt },
            ],
            temperature: 0.6,
        });

        const ai_content = response.choices[0].message.content;
        console.log(ai_content, "ai_content");
        // if (ai_content === "[]") {
        //   if (!ai_content) throw new Error("ai_content is null");
        // }

        return {
            id: response.id,
            ai_content,
            error: null,
        };
    } catch (error) {
        console.error("Error getting completion:", error);
        throw error;
    }
};

interface Task {
    id: number;
    user_id: string;
    title: string;
    description: string;
    created_at: string;
    updated_at: string;
}

export async function getAiFeedbackFromSupabase({
    query,
    username,
    language_code,
}: getAiSupabaseFeedbackT): Promise<{ ai_content: string; tasks: Task[]; data: any }> {
    try {
        const { data } = await supabase.functions.invoke("ask-data", {
            body: JSON.stringify({
                query: `Use emoji. ${query}`,
                username,
                language_code,
            }),
        });

        return {
            ai_content: data.ai_content,
            tasks: data.tasks,
            data,
        };
    } catch (error) {
        throw new Error(`Error receiving AI response: ${error}`);
    }
}

export const matchEmbeddingIds = async (id_array: number[], embeddingUser: unknown) => {
    try {
        const { data, error } = await supabaseSQL
            .rpc("query_embeddings_tasks_with_ids", {
                id_array,
                embedding_vector: JSON.stringify(embeddingUser),
                match_threshold: 0.4,
            })
            .select("*")
            .limit(4);

        if (error) {
            throw new Error(`Error matching matchEmbeddingIds: ${error}`);
        }
        return data;
    } catch (error) {
        throw new Error(`Error matching embedding ask data: ${JSON.stringify(error)}`);
    }
};

export const matchEmbedding = async (rpc_function_name: string, embedding: unknown, search_username: string) => {
    try {
        const { data, error } = await supabaseSQL
            .rpc(rpc_function_name, {
                embedding_vector: JSON.stringify(embedding),
                match_threshold: 0.4,
                match_count: 9,
                search_username,
            })
            .select("*")
            .limit(9);

        if (error) {
            throw new Error(`Error matching matchEmbedding: ${JSON.stringify(error)}`);
        }

        return data;
    } catch (error) {
        throw new Error(`Error matching embedding: ${error}`);
    }
};
