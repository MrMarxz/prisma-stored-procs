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
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.name::VARCHAR as author_name,
    a.email::VARCHAR as author_email,
    COUNT(p.id) as total_posts,
    COUNT(CASE WHEN p.published = true THEN 1 END) as published_posts,
    COALESCE(SUM(p.view_count), 0) as total_views,
    CASE 
      WHEN COUNT(p.id) > 0 THEN 
        ROUND(COALESCE(SUM(p.view_count), 0)::NUMERIC / COUNT(p.id), 2)
      ELSE 0 
    END as avg_views_per_post,
    (
      SELECT p2.title 
      FROM posts p2 
      WHERE p2.author_id = a.id 
      ORDER BY p2.view_count DESC 
      LIMIT 1
    )::VARCHAR as most_popular_post_title,
    (
      SELECT p2.view_count 
      FROM posts p2 
      WHERE p2.author_id = a.id 
      ORDER BY p2.view_count DESC 
      LIMIT 1
    ) as most_popular_post_views,
    COUNT(DISTINCT p.category_id) as categories_used,
    COUNT(DISTINCT pt.tag_id) as total_tags,
    MIN(p.created_at) as first_post_date,
    MAX(p.created_at) as last_post_date
  FROM authors a
  LEFT JOIN posts p ON a.id = p.author_id
  LEFT JOIN post_tags pt ON p.id = pt.post_id
  GROUP BY a.id, a.name, a.email
  ORDER BY total_posts DESC, total_views DESC;
END;
$$;

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
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.title::VARCHAR as post_title,
    a.name::VARCHAR as author_name,
    p.view_count,
    p.published_at,
    COUNT(pt.tag_id) as tag_count
  FROM posts p
  INNER JOIN authors a ON p.author_id = a.id
  INNER JOIN categories c ON p.category_id = c.id
  LEFT JOIN post_tags pt ON p.id = pt.post_id
  WHERE c.slug = category_slug 
    AND p.published = true
  GROUP BY p.id, p.title, a.name, p.view_count, p.published_at
  ORDER BY p.view_count DESC, p.published_at DESC
  LIMIT 10;
END;
$$;