import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";

type KeywordEntry = {
  term: string;
  definition: string;
};

type KeywordData = {
  [section: string]: KeywordEntry[];
};

interface KeywordAccordionProps {
  keywordData: KeywordData;
}

const KeywordAccordion: React.FC<KeywordAccordionProps> = ({ keywordData }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleIndex = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="hidden w-[22rem] relative top-0 left-0 lg:block">
      <Card className="shadow-none">
        {/* <CardHeader className="z-5 text-[1.25rem] font-medium">
          Keywords
        </CardHeader> */}

        <CardContent className="flex flex-col z-10 space-y-2">
          {keywordData.introduction.map((kw, idx) => (
            <div
              key={idx}
              className=" py-2 cursor-pointer"
              onClick={() => toggleIndex(idx)}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{kw.term}</span>
                {openIndex === idx ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>

              {openIndex === idx && (
                <p className="text-[1rem] mt-1 text-muted-foreground">
                  {kw.definition}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default KeywordAccordion;
