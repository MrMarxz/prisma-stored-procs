-- Create a stored procedure to get comprehensive blog analytics
CREATE OR REPLACE FUNCTION get_blog_analytics()
RETURNS TABLE (
  author_name VARCHAR,
  author_email VARCHAR,
  total_posts BIGINT,
  published_posts BIGINT,
  total_views BIGINT,
  avg_views_per_post NUMERIC,
  most_popular_post_title VARCHAR,
  most_popular_post_views INT,
  categories_used BIGINT,
  total_tags BIGINT,
  first_post_date TIMESTAMP,
  last_post_date TIMESTAMP
) 
LANGUAGE plpgsql
AS '
BEGIN
  RETURN QUERY
  SELECT 
    a.name::VARCHAR as author_name,
    a.email::VARCHAR as author_email,
    COUNT(p.id) as total_posts,
    COUNT(CASE WHEN p.published = true THEN 1 END) as published_posts,
    COALESCE(SUM(p."viewCount"), 0) as total_views,
    CASE 
      WHEN COUNT(p.id) > 0 THEN 
        ROUND(COALESCE(SUM(p."viewCount"), 0)::NUMERIC / COUNT(p.id), 2)
      ELSE 0 
    END as avg_views_per_post,
    (
      SELECT p2.title 
      FROM posts p2 
      WHERE p2."authorId" = a.id 
      ORDER BY p2."viewCount" DESC 
      LIMIT 1
    )::VARCHAR as most_popular_post_title,
    (
      SELECT p2."viewCount" 
      FROM posts p2 
      WHERE p2."authorId" = a.id 
      ORDER BY p2."viewCount" DESC 
      LIMIT 1
    ) as most_popular_post_views,
    COUNT(DISTINCT p."categoryId") as categories_used,
    COUNT(DISTINCT pt."tagId") as total_tags,
    MIN(p."createdAt") as first_post_date,
    MAX(p."createdAt") as last_post_date
  FROM authors a
  LEFT JOIN posts p ON a.id = p."authorId"
  LEFT JOIN post_tags pt ON p.id = pt."postId"
  GROUP BY a.id, a.name, a.email
  ORDER BY total_posts DESC, total_views DESC;
END;
';

-- Alternative simpler stored procedure for getting top posts by category
CREATE OR REPLACE FUNCTION get_top_posts_by_category(category_slug VARCHAR)
RETURNS TABLE (
  post_title VARCHAR,
  author_name VARCHAR,
  view_count INT,
  published_at TIMESTAMP,
  tag_count BIGINT
) 
LANGUAGE plpgsql
AS '
BEGIN
  RETURN QUERY
  SELECT 
    p.title::VARCHAR as post_title,
    a.name::VARCHAR as author_name,
    p."viewCount" as view_count,
    p."publishedAt" as published_at,
    COUNT(pt."tagId") as tag_count
  FROM posts p
  INNER JOIN authors a ON p."authorId" = a.id
  INNER JOIN categories c ON p."categoryId" = c.id
  LEFT JOIN post_tags pt ON p.id = pt."postId"
  WHERE c.slug = category_slug 
    AND p.published = true
  GROUP BY p.id, p.title, a.name, p."viewCount", p."publishedAt"
  ORDER BY p."viewCount" DESC, p."publishedAt" DESC
  LIMIT 10;
END;
';