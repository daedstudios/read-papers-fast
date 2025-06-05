import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardHeader, CardContent } from "./ui/card";

type Keyword = {
  id: string;
  keyword: string;
  value: string;
  explanation: string;
};

type KeywordAccordionProps = {
  keyword: Keyword[];
};

const KeywordAccordion = ({ keyword }: KeywordAccordionProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleIndex = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (!keyword) return null;

  return (
    <div className="hidden w-[22rem] lg:block">
      <Card className="shadow-none">
        <CardHeader className="z-5 text-[1.25rem] font-medium">
          Keywords
        </CardHeader>

        <CardContent className="flex flex-col z-10 space-y-2">
          {keyword.map((kw: any, idx: any) => (
            <div
              key={kw.id}
              className="py-2 cursor-pointer"
              onClick={() => toggleIndex(idx)}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold">{kw.keyword}</span>
                {openIndex === idx ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>

              {openIndex === idx && (
                <p className="text-[1rem] mt-1 text-muted-foreground">
                  {kw.explanation}
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
