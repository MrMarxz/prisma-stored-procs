# Blog Analytics Dashboard - Stored Procedures Demo

A demonstration project showcasing how to integrate PostgreSQL stored procedures with modern web development stack including Next.js, Prisma, tRPC, and shadcn/ui.

## 🎯 Purpose

This repository demonstrates advanced database integration patterns, specifically how to:

- **Execute stored procedures** through Prisma's raw query capabilities
- **Maintain type safety** when working with stored procedure results in tRPC
- **Handle PostgreSQL-specific data types** (BIGINT, NUMERIC) in TypeScript
- **Create a full-stack application** with database management capabilities
- **Showcase performance benefits** of database-level computations vs application-level aggregations

The project serves as a practical example for developers who need to work with existing stored procedures or want to leverage database-level performance optimizations while maintaining modern development practices.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   tRPC API      │    │   Prisma ORM    │    │  PostgreSQL     │
│   (Next.js)     │◄──►│   (Type-safe)   │◄──►│   ($queryRaw)   │◄──►│  Stored Procs   │
│   shadcn/ui     │    │   Zod Schemas   │    │   Raw Queries   │    │  Functions      │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📊 Database Schema

The project uses a blog-style schema with the following entities:

- **Authors** - Blog post writers with profiles
- **Categories** - Post categorization (Technology, Web Dev, Database, DevOps)
- **Posts** - Blog articles with view counts, publish status
- **Tags** - Flexible post tagging system
- **PostTags** - Many-to-many relationship between Posts and Tags

## 🔧 Stored Procedures

### 1. `get_blog_analytics()`

**Purpose**: Provides comprehensive analytics for each author in the system.

**What it does**:

- Calculates total posts and published posts per author
- Aggregates total views and computes average views per post
- Identifies the most popular post for each author
- Counts unique categories and tags used by each author
- Tracks first and last post dates for author activity timeline

**Performance Benefits**:

- Single database query instead of multiple round trips
- Database-level aggregations and JOINs for optimal performance
- Subqueries for complex calculations (most popular post)

**Use Case**: Perfect for admin dashboards, author performance reviews, or generating author statistics reports.

```sql
-- Example result:
author_name    | total_posts | published_posts | total_views | avg_views_per_post | most_popular_post_title
Alice Johnson  | 3           | 3               | 4650        | 1550.00            | React Server Components Deep Dive
Bob Smith      | 2           | 1               | 890         | 445.00             | Advanced PostgreSQL Optimization
```

### 2. `get_top_posts_by_category(category_slug)`

**Purpose**: Retrieves the highest-performing posts within a specific category.

**What it does**:

- Filters posts by category slug (e.g., 'web-development', 'database')
- Orders by view count (highest first) and then by publish date
- Includes author information and tag count for each post
- Limits results to top 10 posts for performance
- Only includes published posts

**Performance Benefits**:

- Single parameterized query with efficient filtering
- Database-level sorting eliminates application-side processing
- JOIN optimization for related data retrieval

**Use Case**: Ideal for category landing pages, "trending in category" sections, or content recommendation systems.

```sql
-- Example result for category 'web-development':
post_title                        | author_name   | view_count | tag_count | published_at
React Server Components Deep Dive | David Brown   | 3200       | 3          | 2024-03-01
Modern CSS Techniques for 2024    | David Brown   | 1840       | 1          | 2024-02-15
Getting Started with Next.js 14   | Alice Johnson | 1250       | 3          | 2024-01-15
```

## 🔧 Setup

> **Important**: Your procedures' types and naming should align with Prisma conventions for seamless integration.

### Database Connection

This project uses a **Vercel-hosted PostgreSQL database**. Ensure you have all required credentials:
- Host
- Database name  
- Username
- Password

### Setting Up DBeaver (Recommended DBMS)

Since Prisma doesn't support advanced database management, we recommend **DBeaver** for stored procedure development.

#### Step-by-Step Connection:

1. **Create New Connection**
    - Click **"Add Connection"** (top left)
    - Select **PostgreSQL** → Next

2. **Configure Connection**
    - Choose **"Connect by Host"**
    - Enter **Host** and **Database** details from Vercel
    - Set Authentication to **"Database Native"**
    - Add your **Username** and **Password**

3. **Test & Finalize**
    - Click **"Test Connection"** (bottom left)
    - Once successful, click **"Finish"**
    - Your database appears in the left pane

### Deploying Stored Procedures

1. **Open SQL Editor**
    - Press `Ctrl+]` to create a new SQL script

2. **Add Procedures**
    - Copy and paste the stored procedure code
    - Review the code for accuracy

3. **Execute**
    - Press `Ctrl+Enter` to run the script
    - Select the correct database when prompted
    - Procedures are now deployed to your database

### Verification

After deployment, you can verify the procedures exist by checking the database schema in DBeaver under:
```
Database → Schemas → public → Functions
```

## 🚀 Features

### Database Management

- **Populate Database**: Seeds the database with realistic blog data (4 authors, 4 categories, 10 tags, 8 posts)
- **Clear Database**: Safely removes all data while respecting foreign key constraints
- **Real-time Feedback**: Success/error messages with detailed operation summaries

### Analytics Dashboard

- **Author Performance**: Execute stored procedures to analyze author statistics
- **Category Insights**: Get top-performing posts filtered by category
- **Type-Safe API**: Full end-to-end type safety from database to frontend
- **Modern UI**: Built with shadcn/ui components for professional appearance

### Developer Experience

- **Hot Reload**: Instant feedback during development
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Type Safety**: TypeScript throughout with proper Zod validation
- **Performance**: Database-level computations for optimal speed

## 📈 Performance Considerations

### Why Stored Procedures?

1. **Reduced Network Traffic**: Single query instead of multiple round trips
2. **Database Optimization**: PostgreSQL query planner optimizes complex JOINs
3. **Consistent Performance**: Compiled procedures with execution plan caching
4. **Complex Logic**: Database-level computations for aggregations and analytics
5. **Maintainability**: Centralized business logic in the database layer

### Type Safety Challenges Solved

- **BIGINT Handling**: PostgreSQL COUNT() returns BIGINT, converted to JavaScript numbers
- **NUMERIC Precision**: PostgreSQL NUMERIC types handled as Prisma Decimal objects
- **Date Conversion**: Proper handling of PostgreSQL TIMESTAMP types
- **Null Safety**: Explicit handling of nullable fields in stored procedure results

## 🔄 Data Flow

1. **User Interaction**: Clicks button in React component
2. **tRPC Call**: Type-safe API call to tRPC procedure
3. **Raw Query**: Prisma executes stored procedure via `$queryRaw`
4. **Type Validation**: Zod validates and transforms PostgreSQL types
5. **Frontend Update**: React Query handles caching and UI updates

## 📚 Learning Outcomes

This project demonstrates:

- Integration patterns for stored procedures in modern web applications
- Type safety maintenance when working with database-specific types
- Performance optimization through database-level computations
- Error handling and user feedback in full-stack applications
- Modern development practices with traditional database features

## 🎓 Educational Value

Perfect for developers who want to learn:

- How to bridge traditional database practices with modern web development
- Advanced Prisma usage beyond basic CRUD operations  
- tRPC patterns for complex data transformations
- PostgreSQL stored procedure development
- Type-safe handling of database-specific data types

---

*This project serves as a comprehensive example of how to maintain modern development practices while leveraging the power and performance of database-level computations.*
