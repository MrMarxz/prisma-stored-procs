// server/api/routers/blog.ts - Add this to your existing tRPC router

import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

// Types for stored procedure results
const BlogAnalyticsSchema = z.object({
    author_name: z.string(),
    author_email: z.string(),
    total_posts: z.number(),
    published_posts: z.number(),
    total_views: z.number(),
    avg_views_per_post: z.number(),
    most_popular_post_title: z.string().nullable(),
    most_popular_post_views: z.number().nullable(),
    categories_used: z.number(),
    total_tags: z.number(),
    first_post_date: z.date().nullable(),
    last_post_date: z.date().nullable(),
});

const TopPostSchema = z.object({
    post_title: z.string(),
    author_name: z.string(),
    view_count: z.number(),
    published_at: z.date(),
    tag_count: z.number(),
});

export const blogRouter = createTRPCRouter({
    getBlogAnalytics: publicProcedure
        .output(z.array(BlogAnalyticsSchema))
        .query(async ({ ctx }) => {
            try {
                // Call the stored procedure using Prisma's raw query
                const analytics = await ctx.db.$queryRaw`
          SELECT * FROM get_blog_analytics()
        ` as unknown[];

                // Parse and validate the results
                return z.array(BlogAnalyticsSchema).parse(analytics);
            } catch (error) {
                console.error('Error calling blog analytics stored procedure:', error);
                throw new Error('Failed to fetch blog analytics');
            }
        }),

    getTopPostsByCategory: publicProcedure
        .input(z.object({ category: z.string() }))
        .output(z.array(TopPostSchema))
        .query(async ({ ctx, input }) => {
            try {
                // Call the stored procedure with parameter
                const topPosts = await ctx.db.$queryRaw`
          SELECT * FROM get_top_posts_by_category(${input.category})
        ` as unknown[];

                // Parse and validate the results
                return z.array(TopPostSchema).parse(topPosts);
            } catch (error) {
                console.error('Error calling top posts stored procedure:', error);
                throw new Error('Failed to fetch top posts');
            }
        }),

    // Additional helper procedure to get all posts with basic info
    getAllPosts: publicProcedure
        .query(async ({ ctx }) => {
            return ctx.db.post.findMany({
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    excerpt: true,
                    published: true,
                    viewCount: true,
                    publishedAt: true,
                    author: {
                        select: { name: true, email: true }
                    },
                    category: {
                        select: { name: true, slug: true }
                    },
                    _count: {
                        select: { tags: true }
                    }
                },
                orderBy: { viewCount: 'desc' },
                take: 20
            });
        }),
});
