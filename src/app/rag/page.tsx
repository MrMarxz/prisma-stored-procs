"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, Search, Trash2 } from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";

interface SearchResult {
  id: string;
  content: string;
  similarity: number;
  createdAt: Date;
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  
  // tRPC queries and mutations
  const { data: factCount, refetch: refetchCount } = api.facts.getCount.useQuery();
  
  const populateMutation = api.facts.populateDatabase.useMutation({
    onSuccess: (data) => {
      refetchCount();
      const embeddingType = data.usingRealEmbeddings ? "real OpenAI" : "mock";
      toast.success(`Database populated with ${data.count} facts using ${embeddingType} embeddings`);
    },
    onError: (error) => {
      console.log('Error populating database:', error);
      toast.error(`Failed to populate database: ${error.message}`);
    }
  });
  
  const clearMutation = api.facts.clearDatabase.useMutation({
    onSuccess: () => {
      refetchCount();
      setSearchResults([]);
      toast.success("Database cleared successfully");
    },
    onError: (error) => {
      console.log('Error clearing database:', error);
      toast.error(`Failed to clear database: ${error.message}`);
    }
  });
  
  const searchMutation = api.facts.searchSimilar.useMutation({
    onSuccess: (data) => {
      setSearchResults(data.results);
    },
    onError: (error) => {
      alert(`Search error: ${error.message}`);
    }
  });

  const handlePopulate = () => {
    populateMutation.mutate();
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear all facts from the database?")) {
      clearMutation.mutate();
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      alert("Please enter a search query");
      return;
    }
    searchMutation.mutate({ query: searchQuery, limit: 10 });
  };

  const formatSimilarity = (similarity: number) => {
    return (similarity * 100).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">
            PostgreSQL pgvector Demo
          </h1>
          <p className="text-lg text-gray-600">
            Test semantic search with vector embeddings on random facts
          </p>
        </div>

        {/* Database Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Facts in database: <span className="font-semibold">{factCount ?? 0}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handlePopulate}
                  disabled={populateMutation.isPending}
                  variant="default"
                >
                  {populateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Populate Database
                </Button>
                <Button
                  onClick={handleClear}
                  disabled={clearMutation.isPending}
                  variant="destructive"
                >
                  {clearMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Clear Database
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Interface */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Semantic Search
            </CardTitle>
            <CardDescription>
              Search for facts using natural language. The system will find semantically similar content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter your search query (e.g., 'animals with multiple hearts')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button
                onClick={handleSearch}
                disabled={searchMutation.isPending || !searchQuery.trim()}
              >
                {searchMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
              <CardDescription>
                Results ordered by semantic similarity to your query
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {searchResults.map((result, index) => (
                  <div
                    key={result.id}
                    className="rounded-lg border p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {result.content}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Added: {new Date(result.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-4 flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <Badge 
                          variant={parseFloat(formatSimilarity(result.similarity)) > 50 ? "default" : "outline"}
                          className="text-xs"
                        >
                          {formatSimilarity(result.similarity)}% match
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How to use</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">
            <ol className="list-decimal list-inside space-y-1">
              <li>Click {'"Populate Database"'} to add sample facts with vector embeddings</li>
              <li>Enter a search query in natural language (e.g., {'"ocean animals"'}, {'"space facts"'}, {'"ancient history"'})</li>
              <li>Click {'"Search"'} to find semantically similar facts</li>
              <li>Results are ranked by similarity score using cosine distance</li>
              <li>Use {'"Clear Database"'} to remove all facts and start over</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}