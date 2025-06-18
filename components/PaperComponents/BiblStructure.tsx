import React from "react";

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
  entry: BiblographyEntry;
}

const BiblStructure: React.FC<BiblStructureProps> = ({ entry }) => {
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

  return (
    <div className="bibl-structure my-4">
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

export default BiblStructure;
