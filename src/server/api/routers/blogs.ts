// server/api/routers/blog.ts - Add this to your existing tRPC router

import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

// Raw types that match PostgreSQL output (before transformation)
const BlogAnalyticsRawSchema = z.object({
  author_name: z.string(),
  author_email: z.string(),
  total_posts: z.bigint(),
  published_posts: z.bigint(),
  total_views: z.bigint(),
  avg_views_per_post: z.any().transform(val => {
    // Handle Prisma Decimal objects or regular numbers
    if (val && typeof val === 'object' && 'toNumber' in val) {
      return val.toNumber();
    }
    return Number(val);
  }),
  most_popular_post_title: z.string().nullable(),
  most_popular_post_views: z.number().nullable(),
  categories_used: z.bigint(),
  total_tags: z.bigint(),
  first_post_date: z.date().nullable(),
  last_post_date: z.date().nullable(),
});

const TopPostRawSchema = z.object({
  post_title: z.string(),
  author_name: z.string(),
  view_count: z.number(),
  published_at: z.date(),
  tag_count: z.bigint(),
});

// Transformed types for the API output (bigint -> number)
const BlogAnalyticsOutputSchema = z.object({
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

const TopPostOutputSchema = z.object({
  post_title: z.string(),
  author_name: z.string(),
  view_count: z.number(),
  published_at: z.date(),
  tag_count: z.number(),
});

// Helper functions to transform the data
function transformBlogAnalytics(raw: any): z.infer<typeof BlogAnalyticsOutputSchema> {
  return {
    author_name: raw.author_name,
    author_email: raw.author_email,
    total_posts: Number(raw.total_posts),
    published_posts: Number(raw.published_posts),
    total_views: Number(raw.total_views),
    avg_views_per_post: raw.avg_views_per_post, // Already transformed by Zod
    most_popular_post_title: raw.most_popular_post_title,
    most_popular_post_views: raw.most_popular_post_views,
    categories_used: Number(raw.categories_used),
    total_tags: Number(raw.total_tags),
    first_post_date: raw.first_post_date,
    last_post_date: raw.last_post_date,
  };
}

function transformTopPost(raw: z.infer<typeof TopPostRawSchema>): z.infer<typeof TopPostOutputSchema> {
  return {
    ...raw,
    tag_count: Number(raw.tag_count),
  };
}

export const blogRouter = createTRPCRouter({
  getBlogAnalytics: publicProcedure
    .output(z.array(BlogAnalyticsOutputSchema))
    .query(async ({ ctx }) => {
      try {
        // Call the stored procedure using Prisma's raw query
        const analytics = await ctx.db.$queryRaw`
          SELECT * FROM get_blog_analytics()
        ` as unknown[];
        
        // Parse and validate the raw results
        const rawAnalytics = z.array(BlogAnalyticsRawSchema).parse(analytics);
        
        // Transform bigints to numbers
        return rawAnalytics.map(transformBlogAnalytics);
      } catch (error) {
        console.error('Error calling blog analytics stored procedure:', error);
        throw new Error('Failed to fetch blog analytics');
      }
    }),

  getTopPostsByCategory: publicProcedure
    .input(z.object({ category: z.string() }))
    .output(z.array(TopPostOutputSchema))
    .query(async ({ ctx, input }) => {
      try {
        // Call the stored procedure with parameter
        const topPosts = await ctx.db.$queryRaw`
          SELECT * FROM get_top_posts_by_category(${input.category})
        ` as unknown[];
        
        // Parse and validate the raw results
        const rawTopPosts = z.array(TopPostRawSchema).parse(topPosts);
        
        // Transform bigints to numbers
        return rawTopPosts.map(transformTopPost);
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

  // Populate database with seed data
  populateDatabase: publicProcedure
    .mutation(async ({ ctx }) => {
      try {
        // Clear existing data first (in correct order due to foreign keys)
        await ctx.db.postTag.deleteMany();
        await ctx.db.post.deleteMany();
        await ctx.db.author.deleteMany();
        await ctx.db.category.deleteMany();
        await ctx.db.tag.deleteMany();

        // Create categories
        const categories = await ctx.db.$transaction([
          ctx.db.category.create({
            data: {
              name: 'Technology',
              slug: 'technology',
              description: 'Latest tech trends and tutorials',
            },
          }),
          ctx.db.category.create({
            data: {
              name: 'Web Development',
              slug: 'web-development',
              description: 'Frontend and backend development topics',
            },
          }),
          ctx.db.category.create({
            data: {
              name: 'Database',
              slug: 'database',
              description: 'Database design and optimization',
            },
          }),
          ctx.db.category.create({
            data: {
              name: 'DevOps',
              slug: 'devops',
              description: 'Deployment and infrastructure topics',
            },
          }),
        ]);

        // Create tags
        const tags = await ctx.db.$transaction([
          ctx.db.tag.create({ data: { name: 'React', slug: 'react' } }),
          ctx.db.tag.create({ data: { name: 'Next.js', slug: 'nextjs' } }),
          ctx.db.tag.create({ data: { name: 'TypeScript', slug: 'typescript' } }),
          ctx.db.tag.create({ data: { name: 'PostgreSQL', slug: 'postgresql' } }),
          ctx.db.tag.create({ data: { name: 'Prisma', slug: 'prisma' } }),
          ctx.db.tag.create({ data: { name: 'JavaScript', slug: 'javascript' } }),
          ctx.db.tag.create({ data: { name: 'CSS', slug: 'css' } }),
          ctx.db.tag.create({ data: { name: 'Docker', slug: 'docker' } }),
          ctx.db.tag.create({ data: { name: 'AWS', slug: 'aws' } }),
          ctx.db.tag.create({ data: { name: 'Node.js', slug: 'nodejs' } }),
        ]);

        // Create authors
        const authors = await ctx.db.$transaction([
          ctx.db.author.create({
            data: {
              name: 'Alice Johnson',
              email: 'alice@example.com',
              bio: 'Full-stack developer with 8 years of experience in React and Node.js',
            },
          }),
          ctx.db.author.create({
            data: {
              name: 'Bob Smith',
              email: 'bob@example.com',
              bio: 'Database architect and PostgreSQL expert',
            },
          }),
          ctx.db.author.create({
            data: {
              name: 'Carol Williams',
              email: 'carol@example.com',
              bio: 'DevOps engineer specializing in cloud infrastructure',
            },
          }),
          ctx.db.author.create({
            data: {
              name: 'David Brown',
              email: 'david@example.com',
              bio: 'Frontend developer passionate about modern web technologies',
            },
          }),
        ]);

        // Create posts with tags
        const postsData = [
          {
            title: 'Getting Started with Next.js 14',
            slug: 'getting-started-nextjs-14',
            content: 'Learn how to build modern web applications with the latest Next.js features...',
            excerpt: 'A comprehensive guide to Next.js 14 new features',
            published: true,
            publishedAt: new Date('2024-01-15'),
            authorId: authors[0]!.id,
            categoryId: categories[1]!.id,
            viewCount: 1250,
            tagIds: [tags[1]!.id, tags[2]!.id, tags[5]!.id],
          },
          {
            title: 'Advanced PostgreSQL Optimization Techniques',
            slug: 'postgresql-optimization-techniques',
            content: 'Deep dive into PostgreSQL performance tuning and optimization strategies...',
            excerpt: 'Master the art of PostgreSQL performance optimization',
            published: true,
            publishedAt: new Date('2024-01-20'),
            authorId: authors[1]!.id,
            categoryId: categories[2]!.id,
            viewCount: 890,
            tagIds: [tags[3]!.id],
          },
          {
            title: 'Building Type-Safe APIs with Prisma',
            slug: 'type-safe-apis-prisma',
            content: 'Learn how to create fully type-safe database operations with Prisma...',
            excerpt: 'Type safety from database to frontend with Prisma',
            published: true,
            publishedAt: new Date('2024-02-01'),
            authorId: authors[0]!.id,
            categoryId: categories[2]!.id,
            viewCount: 2150,
            tagIds: [tags[4]!.id, tags[2]!.id, tags[3]!.id],
          },
          {
            title: 'Docker Deployment Best Practices',
            slug: 'docker-deployment-best-practices',
            content: 'Essential practices for deploying applications with Docker in production...',
            excerpt: 'Production-ready Docker deployment strategies',
            published: true,
            publishedAt: new Date('2024-02-10'),
            authorId: authors[2]!.id,
            categoryId: categories[3]!.id,
            viewCount: 760,
            tagIds: [tags[7]!.id, tags[8]!.id],
          },
          {
            title: 'Modern CSS Techniques for 2024',
            slug: 'modern-css-techniques-2024',
            content: 'Explore the latest CSS features and techniques for modern web design...',
            excerpt: 'Stay up to date with modern CSS features',
            published: true,
            publishedAt: new Date('2024-02-15'),
            authorId: authors[3]!.id,
            categoryId: categories[1]!.id,
            viewCount: 1840,
            tagIds: [tags[6]!.id],
          },
          {
            title: 'React Server Components Deep Dive',
            slug: 'react-server-components-deep-dive',
            content: 'Understanding React Server Components and their impact on web development...',
            excerpt: 'Master React Server Components',
            published: true,
            publishedAt: new Date('2024-03-01'),
            authorId: authors[3]!.id,
            categoryId: categories[1]!.id,
            viewCount: 3200,
            tagIds: [tags[0]!.id, tags[1]!.id, tags[2]!.id],
          },
          {
            title: 'Database Migrations with Prisma',
            slug: 'database-migrations-prisma',
            content: 'Learn how to handle database schema changes effectively with Prisma migrations...',
            excerpt: 'Safe database migrations with Prisma',
            published: false,
            publishedAt: null,
            authorId: authors[1]!.id,
            categoryId: categories[2]!.id,
            viewCount: 0,
            tagIds: [tags[4]!.id, tags[3]!.id],
          },
          {
            title: 'AWS Lambda with Node.js',
            slug: 'aws-lambda-nodejs',
            content: 'Building serverless applications with AWS Lambda and Node.js...',
            excerpt: 'Serverless computing with AWS Lambda',
            published: true,
            publishedAt: new Date('2024-03-10'),
            authorId: authors[2]!.id,
            categoryId: categories[3]!.id,
            viewCount: 1100,
            tagIds: [tags[8]!.id, tags[9]!.id],
          },
        ];

        // Create posts and link tags
        for (const postData of postsData) {
          const { tagIds, ...postInfo } = postData;
          
          const post = await ctx.db.post.create({
            data: postInfo,
          });

          // Create post-tag relationships
          await ctx.db.$transaction(
            tagIds.map(tagId =>
              ctx.db.postTag.create({
                data: {
                  postId: post.id,
                  tagId: tagId,
                },
              })
            )
          );
        }

        // Return summary of created data
        const counts = await ctx.db.$transaction([
          ctx.db.author.count(),
          ctx.db.category.count(),
          ctx.db.tag.count(),
          ctx.db.post.count(),
          ctx.db.postTag.count(),
        ]);

        return {
          success: true,
          message: `Database populated successfully! Created ${counts[0]} authors, ${counts[1]} categories, ${counts[2]} tags, ${counts[3]} posts, and ${counts[4]} post-tag relationships.`,
          counts: {
            authors: counts[0],
            categories: counts[1],
            tags: counts[2],
            posts: counts[3],
            postTags: counts[4],
          },
        };
      } catch (error) {
        console.error('Error populating database:', error);
        throw new Error('Failed to populate database');
      }
    }),

  // Clear all database data
  clearDatabase: publicProcedure
    .mutation(async ({ ctx }) => {
      try {
        // Get counts before deletion
        const beforeCounts = await ctx.db.$transaction([
          ctx.db.author.count(),
          ctx.db.category.count(),
          ctx.db.tag.count(),
          ctx.db.post.count(),
          ctx.db.postTag.count(),
        ]);

        // Delete all data in correct order (respecting foreign key constraints)
        await ctx.db.$transaction([
          ctx.db.postTag.deleteMany(),
          ctx.db.post.deleteMany(),
          ctx.db.author.deleteMany(),
          ctx.db.category.deleteMany(),
          ctx.db.tag.deleteMany(),
        ]);

        return {
          success: true,
          message: `Database cleared successfully! Removed ${beforeCounts[0]} authors, ${beforeCounts[1]} categories, ${beforeCounts[2]} tags, ${beforeCounts[3]} posts, and ${beforeCounts[4]} post-tag relationships.`,
          deletedCounts: {
            authors: beforeCounts[0],
            categories: beforeCounts[1],
            tags: beforeCounts[2],
            posts: beforeCounts[3],
            postTags: beforeCounts[4],
          },
        };
      } catch (error) {
        console.error('Error clearing database:', error);
        throw new Error('Failed to clear database');
      }
    }),
});

// Don't forget to add this router to your main router in server/api/root.ts:
// export const appRouter = createTRPCRouter({
//   blog: blogRouter,
//   // ... other routers
// });