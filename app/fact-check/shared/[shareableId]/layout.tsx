import { Metadata } from "next";

type Props = {
  children: React.ReactNode;
  params: { shareableId: string };
};

async function getFactCheckData(shareableId: string) {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://findpapersfast.com";

    const response = await fetch(
      `${baseUrl}/api/fact-check/db-save?shareableId=${shareableId}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Error fetching fact check data:", error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const factCheckData = await getFactCheckData(params.shareableId);

  if (!factCheckData) {
    return {
      title: "Fact Check - Shit-Check",
      description: "Check the full analysis with peer-reviewed papers",
    };
  }

  const { statement, finalVerdict } = factCheckData;
  const verdictText =
    finalVerdict?.final_verdict?.toUpperCase().replace(/_/g, " ") ||
    "INSUFFICIENT EVIDENCE";
  const confidence = finalVerdict?.confidence_score || 0;

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NODE_ENV === "development"
    ? "http://localhost:3002"
    : "https://findpapersfast.com";

  const ogImageUrl = `${baseUrl}/api/og-image?statement=${encodeURIComponent(
    statement
  )}&verdict=${encodeURIComponent(
    finalVerdict?.final_verdict || "insufficient_evidence"
  )}&confidence=${confidence}`;

  return {
    title: `"${statement}" - ${verdictText} | Shit-Check`,
    description: `Shit-Check evidence shows: ${verdictText} (${confidence}% confidence). Check the full analysis with peer-reviewed papers.`,
    keywords: [
      "fact-check",
      "research",
      "verification",
      "evidence",
      "academic papers",
    ],
    authors: [{ name: "Shit-Check" }],
    openGraph: {
      title: `"${statement}" - ${verdictText}`,
      description: `Shit-Check evidence shows: ${verdictText} (${confidence}% confidence). Check the full analysis with peer-reviewed papers.`,
      type: "website",
      url: `${baseUrl}/fact-check/shared/${params.shareableId}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `Shit-Check verdict: ${verdictText}`,
        },
      ],
      siteName: "Shit-Check",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: `"${statement}" - ${verdictText}`,
      description: `Shit-Check evidence shows: ${verdictText} (${confidence}% confidence). Check the full analysis with peer-reviewed papers.`,
      images: [ogImageUrl],
      creator: "@shitcheck",
      site: "@shitcheck",
    },
    other: {
      "theme-color": "#000000",
    },
  };
}

export default function SharedFactCheckLayout({ children }: Props) {
  return children;
}
