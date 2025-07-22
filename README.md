# Setup Instructions for Next.js + Prisma + tRPC + shadcn/ui + Stored Procedures

## Prerequisites

- Next.js project with tRPC already set up
- Prisma configured with PostgreSQL
- shadcn/ui components installed

## Steps to Add the Blog Analytics Features

### 1. Update your Prisma schema

Add the blog models to your existing `prisma/schema.prisma` file.

### 2. Create and run migrations

```bash
npx prisma migrate dev --name add-blog-models
```

### 3. Create the stored procedures

Run the SQL script in your PostgreSQL database to create the stored procedures:
- `get_blog_analytics()` - Returns comprehensive blog analytics by author
- `get_top_posts_by_category(category_slug)` - Returns top posts for a specific category

### 4. Add the blog router to tRPC

Create `server/api/routers/blog.ts` with the tRPC procedures.

Then update your `server/api/root.ts`:
```typescript
export const appRouter = createTRPCRouter({
  blog: blogRouter,
  // ... your existing routers
});
```

### 5. Seed the database

Create `prisma/seed.ts` and run:
```bash
npx tsx prisma/seed.ts
```

### 6. Install required shadcn/ui components

```bash
npx shadcn-ui@latest add card button table select badge
```

### 7. Update your page

Replace your existing page with the updated component that uses tRPC and shadcn/ui.

## Key Features Demonstrated

### Stored Procedures

- **Complex analytics**: The `get_blog_analytics()` procedure performs complex joins and aggregations
- **Parameterized queries**: The `get_top_posts_by_category()` procedure accepts parameters
- **Type safety**: Results are validated using Zod schemas

### tRPC Integration

- **Type-safe API calls**: Full end-to-end type safety from database to frontend
- **Caching and refetching**: Built-in React Query integration
- **Error handling**: Proper error boundaries and loading states

### shadcn/ui Components

- **Modern UI**: Professional-looking components with Tailwind CSS
- **Accessible**: Built-in accessibility features
- **Responsive**: Mobile-friendly design

## Database Schema Highlights

- **Relations**: Authors, Posts, Categories, Tags with many-to-many relationships
- **Indexes**: Performance-optimized with strategic indexing
- **Constraints**: Data integrity with foreign keys and unique constraints

## Testing the Stored Procedures

1. Click "Run Blog Analytics Stored Procedure" to execute `get_blog_analytics()`
2. Select a category and click "Get Top Posts" to execute `get_top_posts_by_category()`
3. Both procedures demonstrate different aspects of stored procedure usage in Prisma"@types/node": "^20.10.5",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.0.4",
    "postcss": "^8.4.32",
    "prisma": "^5.7.1",
    "tailwindcss": "^3.4.0",
    "tsx": "^4.6.2",
    "typescript": "^5.3.3"
  }
}