import React from "react";
import References from "./References";

// Define interfaces for the note and reference structures
interface Reference {
  text: string;
  type: string;
  target: string;
}

export interface Note {
  id: string;
  paper_summary_id: string;
  xml_id: string;
  place: string;
  note_number: string;
  content: string;
  references: Reference[];
  html_content: string;
  created_at: string;
  updated_at: string;
}

interface PaperNotesProps {
  notes: Note[];
}

const PaperNotes: React.FC<PaperNotesProps> = ({ notes }) => {
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
