
import { z } from "zod";
import OpenAI from 'openai';
import { createTRPCRouter, publicProcedure } from "../trpc";
import { db } from "@/server/db";
import { env } from "@/env";

const openai = new OpenAI({
    apiKey: env.OPEN_AI_KEY,
});

async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text,
        });
        return response.data[0]?.embedding ?? [];
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw new Error('Failed to generate embedding');
    }
}

// Choose embedding function based on environment
const generateEmbeddingForText = generateEmbedding;

const dummyFacts = [
    // Ocean/Sea creatures
    "Octopuses have three hearts and blue blood.",
    "A shrimp's heart is in its head.",
    "Dolphins have names for each other - unique whistle signatures.",
    "Sharks are older than trees - they've existed for over 400 million years.",
    "There's a species of jellyfish that is technically immortal.",
    "The Pacific Ocean is larger than all land masses combined.",
    "Mantis shrimp can see 16 types of color vision (humans see 3).",
    "Blue whales are the largest animals ever known to have lived on Earth.",
    "Sea otters hold hands while sleeping to prevent drifting apart.",
    "Starfish can regenerate lost arms and even grow a new body from a single arm.",
    "Electric eels can generate up to 600 volts of electricity.",
    "The giant Pacific octopus has three hearts and can change color instantly.",

    // Land animals
    "Wombat poop is cube-shaped to prevent it from rolling away.",
    "Polar bear skin is actually black, and their fur is hollow and transparent.",
    "Cats can't taste sweetness - they lack the taste receptors for it.",
    "Elephants are afraid of bees and have a special alarm call for them.",
    "A group of flamingos is called a 'flamboyance'.",
    "Penguins can jump up to 6 feet out of water.",
    "The longest recorded flight of a chicken is 13 seconds.",
    "Butterflies taste with their feet and smell with their antennae.",

    // Space/Science
    "Venus rotates backwards compared to most planets.",
    "A day on Venus is longer than its year.",
    "A bolt of lightning is five times hotter than the surface of the sun.",
    "The human brain uses about 20% of the body's total energy.",
    "There are more possible games of chess than atoms in the observable universe.",

    // Food/Nature
    "Honey never spoils and has been found in ancient Egyptian tombs still edible.",
    "Bananas are berries, but strawberries aren't.",

    // History
    "The shortest war in history lasted only 38-45 minutes between Britain and Zanzibar in 1896.",
    "Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid.",
    "The Great Wall of China isn't visible from space with the naked eye."
];

export const factsRouter = createTRPCRouter({
    populateDatabase: publicProcedure.mutation(async () => {
        try {
            // Clear existing facts first
            await db.$executeRaw`DELETE FROM facts`;

            // Insert dummy facts with embeddings
            for (const fact of dummyFacts) {
                const embedding = await generateEmbeddingForText(fact);
                const embeddingString = `[${embedding.join(',')}]`;

                await db.$executeRaw`
          INSERT INTO facts (id, content, embedding, "createdAt", "updatedAt")
          VALUES (gen_random_uuid()::text, ${fact}, ${embeddingString}::vector, NOW(), NOW())
        `;
            }

            const count = await db.fact.count();
            return {
                success: true,
                count,
                usingRealEmbeddings: !!process.env.OPENAI_API_KEY
            };
        } catch (error) {
            console.error('Error populating database:', error);
            throw new Error('Failed to populate database');
        }
    }),

    clearDatabase: publicProcedure.mutation(async () => {
        try {
            await db.$executeRaw`DELETE FROM facts`;
            return { success: true };
        } catch (error) {
            console.error('Error clearing database:', error);
            throw new Error('Failed to clear database');
        }
    }),

    searchSimilar: publicProcedure
        .input(z.object({
            query: z.string().min(1),
            limit: z.number().min(1).max(20).default(5)
        }))
        .mutation(async ({ input }) => {
            try {
                const { query, limit } = input;

                // Generate embedding for the search query
                const queryEmbedding = await generateEmbeddingForText(query);
                const embeddingString = `[${queryEmbedding.join(',')}]`;

                // Search for similar facts using cosine similarity
                const results = await db.$queryRaw<Array<{
                    id: string;
                    content: string;
                    similarity: number;
                    createdAt: Date;
                }>>`
                    SELECT 
                        id,
                        content,
                        (embedding <=> ${embeddingString}::vector) * -1 + 1 as similarity,
                        "createdAt"
                    FROM facts
                    ORDER BY embedding <=> ${embeddingString}::vector
                    LIMIT ${limit}
                    `;

                return {
                    results,
                    usingRealEmbeddings: !!env.OPEN_AI_KEY
                };
            } catch (error) {
                console.error('Error searching similar facts:', error);
                throw new Error('Failed to search similar facts');
            }
        }),

    getAll: publicProcedure.query(async () => {
        return await db.fact.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }),

    getCount: publicProcedure.query(async () => {
        return await db.fact.count();
    })
});