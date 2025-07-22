"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarDays, Eye, FileText, User, TrendingUp, Database, Trash2, CheckCircle, AlertCircle } from "lucide-react";

const categories = [
  { slug: 'technology', name: 'Technology' },
  { slug: 'web-development', name: 'Web Development' },
  { slug: 'database', name: 'Database' },
  { slug: 'devops', name: 'DevOps' },
];

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('technology');
  const [dbMessage, setDbMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // tRPC queries
  const {
    data: analytics,
    isLoading: analyticsLoading,
    refetch: refetchAnalytics
  } = api.blogs.getBlogAnalytics.useQuery(undefined, {
    enabled: false, // Only run when button is clicked
  });

  const {
    data: topPosts,
    isLoading: topPostsLoading,
    refetch: refetchTopPosts
  } = api.blogs.getTopPostsByCategory.useQuery(
    { category: selectedCategory },
    { enabled: false }
  );

  // Basic posts query to show some initial data
  const { data: allPosts, refetch: refetchAllPosts } = api.blogs.getAllPosts.useQuery();

  // Database management mutations
  const populateDb = api.blogs.populateDatabase.useMutation({
    onSuccess: (data) => {
      setDbMessage({ type: 'success', message: data.message });
      void refetchAllPosts();
    },
    onError: (error) => {
      setDbMessage({ type: 'error', message: error.message });
    }
  });

  const clearDb = api.blogs.clearDatabase.useMutation({
    onSuccess: (data) => {
      setDbMessage({ type: 'success', message: data.message });
      void refetchAllPosts();
    },
    onError: (error) => {
      setDbMessage({ type: 'error', message: error.message });
    }
  });

  const handleRunAnalytics = () => {
    void refetchAnalytics();
  };

  const handleGetTopPosts = () => {
    void refetchTopPosts();
  };

  const handlePopulateDatabase = () => {
    setDbMessage(null);
    populateDb.mutate();
  };

  const handleClearDatabase = () => {
    setDbMessage(null);
    clearDb.mutate();
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Blog Analytics Dashboard
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Test stored procedures with Prisma, tRPC, and PostgreSQL. Manage your database and execute advanced queries.
          </p>
        </div>

        {/* Database Management Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Management
            </CardTitle>
            <CardDescription>
              Populate the database with sample data or clear all existing data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handlePopulateDatabase}
                disabled={populateDb.isPending}
                className="flex-1"
              >
                <Database className="h-4 w-4 mr-2" />
                {populateDb.isPending ? "Populating..." : "Populate Database"}
              </Button>
              
              <Button 
                onClick={handleClearDatabase}
                disabled={clearDb.isPending}
                variant="destructive"
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {clearDb.isPending ? "Clearing..." : "Clear Database"}
              </Button>
            </div>

            {dbMessage && (
              <Alert className={dbMessage.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                {dbMessage.type === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={dbMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                  {dbMessage.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Current Posts Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Posts Overview
            </CardTitle>
            <CardDescription>
              Current posts in the database (loaded via regular Prisma query)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allPosts && allPosts.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {allPosts.slice(0, 6).map((post) => (
                  <div key={post.id} className="border rounded-lg p-4 space-y-2">
                    <h3 className="font-semibold line-clamp-2">{post.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>By {post.author.name}</span>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {post.viewCount}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {post.category.name}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No posts found. Click {"'Populate Database'"} to add sample data!</p>
            )}
          </CardContent>
        </Card>

        {/* Blog Analytics Stored Procedure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Author Analytics (Stored Procedure)
            </CardTitle>
            <CardDescription>
              Execute the <code className="bg-muted px-2 py-1 rounded text-sm">get_blog_analytics()</code> stored procedure to analyze blog performance by author.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleRunAnalytics} 
              disabled={analyticsLoading}
              className="w-full sm:w-auto"
            >
              {analyticsLoading ? "Running..." : "Run Blog Analytics Stored Procedure"}
            </Button>

            {analytics && analytics.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Author</TableHead>
                      <TableHead>Total Posts</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead>Total Views</TableHead>
                      <TableHead>Avg Views</TableHead>
                      <TableHead>Most Popular Post</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.map((author, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{author.author_name}</div>
                            <div className="text-sm text-muted-foreground">{author.author_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{author.total_posts}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">{author.published_posts}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            {author.total_views.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>{author.avg_views_per_post}</TableCell>
                        <TableCell>
                          <div className="space-y-1 max-w-xs">
                            <div className="text-sm font-medium line-clamp-2">
                              {author.most_popular_post_title || "N/A"}
                            </div>
                            {author.most_popular_post_views && (
                              <div className="text-xs text-muted-foreground">
                                {author.most_popular_post_views.toLocaleString()} views
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Posts by Category Stored Procedure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Top Posts by Category (Stored Procedure)
            </CardTitle>
            <CardDescription>
              Execute the <code className="bg-muted px-2 py-1 rounded text-sm">get_top_posts_by_category()</code> stored procedure with a parameter.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                onClick={handleGetTopPosts}
                disabled={topPostsLoading}
              >
                {topPostsLoading ? "Loading..." : "Get Top Posts"}
              </Button>
            </div>

            {topPosts && topPosts.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Top Posts in {categories.find(c => c.slug === selectedCategory)?.name}
                </h3>
                <div className="grid gap-4">
                  {topPosts.map((post, index) => (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-2 flex-1">
                            <h4 className="font-semibold text-lg">{post.post_title}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {post.author_name}
                              </span>
                              <span className="flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                {post.tag_count} tags
                              </span>
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-4 w-4" />
                                {new Date(post.published_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              {post.view_count.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">views</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {topPosts && topPosts.length === 0 && (
              <p className="text-muted-foreground">No posts found in this category.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}