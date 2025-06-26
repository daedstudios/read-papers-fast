"use client";

import React, { useEffect, useState } from "react";

export interface Author {
  id: string;
  reference_id: string;
  forename: string;
  forename_type: string;
  surname: string;
  position: number;
  created_at: string;
}

export interface BiblographyEntry {
  id: string;
  created_at: string;
  updated_at: string;
  xml_id: string;
  doi: string | null;
  url: string | null;
  title: string;
  title_level: string;
  title_type: string;
  journal: string;
  volume: string;
  issue: string | null;
  page_from: string;
  page_to: string;
  page_range: string;
  publication_date: string;
  date_type: string;
  paper_summary_id: string;
  authors: Author[];
}

interface BiblStructureProps {
  id: string;
}

// Format authors as a string (e.g., "L. Sarmiento, J. Emmerling, ...")
const formatAuthors = (authors: Author[]) => {
  // Sort authors by position
  const sortedAuthors = [...authors].sort((a, b) => a.position - b.position);

  return sortedAuthors
    .map((author) => {
      // Handle cases where surname might be empty
      if (!author.surname && author.forename === ".") return "";
      if (!author.surname) return author.forename;

      const initials = author.forename === "." ? "" : `${author.forename}.`;
      return `${initials} ${author.surname}`;
    })
    .filter((name) => name !== "")
    .join(", ");
};

const ReferenceEntry: React.FC<{ entry: BiblographyEntry }> = ({ entry }) => {
  return (
    <div className="bibl-structure my-4" id={`bibr-#${entry.xml_id}`}>
      <div className="authors">
        <strong>Authors:</strong> {formatAuthors(entry.authors)}
      </div>

      <div className="title">
        <strong>Title:</strong> {entry.title}
      </div>

      <div className="publication">
        <strong>Journal:</strong> {entry.journal}
        {entry.volume && <span>, Volume {entry.volume}</span>}
        {entry.issue && <span>, Issue {entry.issue}</span>}
        {entry.page_range && <span>, {entry.page_range}</span>}
      </div>

      <div className="publication-date">
        <strong>Published:</strong> {entry.publication_date}
      </div>

      {entry.doi && (
        <div className="doi">
          <strong>DOI:</strong> {entry.doi}
        </div>
      )}

      {entry.url && (
        <div className="url">
          <strong>URL:</strong>{" "}
          <a href={entry.url} target="_blank" rel="noopener noreferrer">
            {entry.url}
          </a>
        </div>
      )}

      <div className="reference-id">
        <strong>Reference ID:</strong> {entry.xml_id}
      </div>
    </div>
  );
};

const BiblStructure: React.FC<BiblStructureProps> = ({ id }) => {
  const [references, setReferences] = useState<BiblographyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReferences() {
      if (!id) {
        setError("Paper ID is required");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/paper-data/bibl?id=${id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch references");
        }

        const data = await response.json();
        setReferences(data.references);
      } catch (err) {
        console.error("Error fetching references:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchReferences();
  }, [id]);

  if (loading) {
    return <div className="text-muted-foreground">Loading references...</div>;
  }

  if (error) {
    return (
      <div className="text-red-500">Error loading references: {error}</div>
    );
  }

  if (!references || references.length === 0) {
    return <div className="text-muted-foreground">No references available</div>;
  }

  return (
    <div className="references-section">
      <h3 className="text-[1.5rem] font-medium mb-4">References</h3>
      {references.map((ref, index) => (
        <ReferenceEntry key={ref.id || index} entry={ref} />
      ))}
    </div>
  );
};

export default BiblStructure;
