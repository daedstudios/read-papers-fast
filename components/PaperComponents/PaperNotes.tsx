"use client";

import React, { useEffect, useState } from "react";
import References, { ReferenceType } from "./References";

export interface Note {
  id: string;
  paper_summary_id: string;
  xml_id: string;
  place: string;
  note_number: string;
  content: string;
  references: ReferenceType[];
  html_content: string;
  created_at: string;
  updated_at: string;
}

interface PaperNotesProps {
  id: string;
}

const PaperNotes: React.FC<PaperNotesProps> = ({ id }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/paper-data/notes?id=${id}`);

        if (!response.ok) {
          throw new Error(`Error fetching notes: ${response.statusText}`);
        }

        const data = await response.json();
        setNotes(data.paperNotes);
      } catch (err) {
        console.error("Failed to fetch notes:", err);
        setError(err instanceof Error ? err.message : "Failed to load notes");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchNotes();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-6 w-6 border-2 border-gray-500 rounded-full border-t-transparent"></div>
        <span className="ml-2 text-gray-500">Loading notes...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (!notes || notes.length === 0) {
    return <div className="text-gray-500 italic">No notes available</div>;
  }

  return (
    <div className="space-y-6" id="paper-notes">
      <h3 className="text-xl font-semibold">Notes</h3>

      {notes.map((note) => (
        <div
          key={note.id}
          className="border rounded-lg p-4 shadow-sm bg-white"
          id={`foot-#${note.xml_id}`}
        >
          <div className="flex justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">
                Note {note.note_number}
              </span>
              {note.place && (
                <span className="text-sm text-gray-500">({note.place})</span>
              )}
            </div>
            <span className="text-xs text-gray-400">ID: {note.xml_id}</span>
          </div>

          {/* Display the content - using html_content if available, otherwise plain content */}
          {note.html_content ? (
            <div
              className="prose prose-sm max-w-none mb-4"
              dangerouslySetInnerHTML={{ __html: note.html_content }}
            />
          ) : (
            <p className="mb-4 text-gray-700">{note.content}</p>
          )}

          {/* Display references if available */}
          {note.references && note.references.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2 text-gray-600">
                References:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {note.references.map((reference, index) => (
                  <References
                    key={`${note.id}-ref-${index}`}
                    text={reference.text}
                    type={reference.type}
                    target={reference.target}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PaperNotes;
