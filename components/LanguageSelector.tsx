"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  disabled?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  disabled = false,
}) => {
  const languages: Language[] = [
    { code: "en-US", name: "English", nativeName: "English" },
    { code: "es-ES", name: "Spanish", nativeName: "Español" },
    { code: "fr-FR", name: "French", nativeName: "Français" },
    { code: "de-DE", name: "German", nativeName: "Deutsch" },
    { code: "it-IT", name: "Italian", nativeName: "Italiano" },
    { code: "pt-BR", name: "Portuguese", nativeName: "Português" },
    { code: "ru-RU", name: "Russian", nativeName: "Русский" },
    { code: "ja-JP", name: "Japanese", nativeName: "日本語" },
    { code: "ko-KR", name: "Korean", nativeName: "한국어" },
    { code: "zh-CN", name: "Chinese (Simplified)", nativeName: "中文（简体）" },
    {
      code: "zh-TW",
      name: "Chinese (Traditional)",
      nativeName: "中文（繁體）",
    },
    { code: "ar-SA", name: "Arabic", nativeName: "العربية" },
    { code: "hi-IN", name: "Hindi", nativeName: "हिन्दी" },
    { code: "nl-NL", name: "Dutch", nativeName: "Nederlands" },
    { code: "sv-SE", name: "Swedish", nativeName: "Svenska" },
    { code: "da-DK", name: "Danish", nativeName: "Dansk" },
    { code: "no-NO", name: "Norwegian", nativeName: "Norsk" },
    { code: "fi-FI", name: "Finnish", nativeName: "Suomi" },
    { code: "pl-PL", name: "Polish", nativeName: "Polski" },
    { code: "tr-TR", name: "Turkish", nativeName: "Türkçe" },
  ];

  const [isOpen, setIsOpen] = React.useState(false);
  const selectedLang =
    languages.find((lang) => lang.code === selectedLanguage) || languages[0];

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 border-foreground rounded-none cursor-pointer"
      >
        <Globe className="h-4 w-4" />
        <span className="text-[1rem]">
          {selectedLang.code.split("-")[0].toUpperCase()}
        </span>
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-foreground rounded-sm shadow-lg z-50 cursor-pointer max-h-60 overflow-y-auto min-w-[200px]">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => {
                onLanguageChange(language.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors cursor-pointer ${
                selectedLanguage === language.code ? "bg-muted" : ""
              }`}
            >
              <div className="font-medium">{language.name}</div>
              <div className="text-xs text-muted-foreground">
                {language.nativeName}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};

export default LanguageSelector;
