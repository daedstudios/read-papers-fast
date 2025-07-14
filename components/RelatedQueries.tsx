"use client";

import { useState, useEffect } from "react";
import { Loader2, Search } from "lucide-react";

type SuggestedQuery = {
  query: string;
  reasoning: string;
  category: string;
};

type RelatedQueriesProps = {
  originalQuery: string;
  onQuerySelect: (query: string) => void;
};

export default function RelatedQueries({
  originalQuery,
  onQuerySelect,
}: RelatedQueriesProps) {
  const [suggestions, setSuggestions] = useState<SuggestedQuery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!originalQuery) return;

    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/suggest-queries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: originalQuery }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch suggestions");
        }

        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
        setError("Failed to load related queries");
      } finally {
        setLoading(false);
      }
    };

    // Delay the API call slightly to let the main results load first
    const timer = setTimeout(fetchSuggestions, 1000);
    return () => clearTimeout(timer);
  }, [originalQuery]);

  if (loading) {
    return (
      <div className="w-full max-w-[48rem] mb-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-[1rem] font-medium">Related Queries</h3>
          <Loader2 size={16} className="animate-spin text-muted-foreground" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-10 bg-muted/20 rounded-full animate-pulse"
              style={{ width: `${120 + Math.random() * 100}px` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-[48rem] mb-[2rem]">
      <h3 className="text-[1.25rem] mb-4">Related Queries</h3>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onQuerySelect(suggestion.query)}
            className="group text-left hover:bg-muted text-foreground  px-4 py-2 rounded-full text-sm border border-muted hover:border-muted-foreground/30 transition-all duration-200 flex items-center gap-2 cursor-pointer"
            title={suggestion.reasoning}
          >
            <Search size={14} className="opacity-60 group-hover:opacity-100" />
            <span>{suggestion.query}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground my-[1rem]">
        Click on any query to explore related research
      </p>
    </div>
  );
}
