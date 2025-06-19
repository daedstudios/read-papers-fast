import React from "react";
import { Button } from "../ui/button";

interface Reference {
  target: string;
  text: string;
  type: string;
}

const References = ({ target, text, type }: Reference) => {
  return (
    <div className="text-sm flex flex-col p-3 space-y-2 border rounded-md shadow-sm">
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-700">Type:</span>
        <span className="text-gray-600">{type}</span>
      </div>
      <div className="flex items-start gap-2">
        <span className="font-medium text-gray-700">Text:</span>
        <span className="text-gray-600">{text}</span>
      </div>
      <div className="flex items-start gap-2">
        <span className="font-medium text-gray-700">Target:</span>
        <span className="text-gray-600">{target}</span>
      </div>
      {type === "bibr" && (
        <Button
          onClick={() => {
            console.log("Scrolling to reference:", target);
            document.getElementById(`bibr-${target}`)?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
        >
          take me to ref
        </Button>
      )}
      {type === "foot" && (
        <Button
          onClick={() => {
            console.log("Scrolling to reference:", target);
            document.getElementById(`foot-${target}`)?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
        >
          take me to note
        </Button>
      )}
    </div>
  );
};

export default References;
