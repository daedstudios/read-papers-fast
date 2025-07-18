-- CreateTable
CREATE TABLE "WaitlistSignup" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistSignup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "imageUrl" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperSummary" (
    "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "title" TEXT NOT NULL,
    "fileName" TEXT,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authors" TEXT[],
    "publishedDate" TEXT,
    "summary" TEXT,
    "paperSummaryID" UUID,
    "relevanceSummary" TEXT,

    CONSTRAINT "PaperSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "paperSummaryId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Survey" (
    "id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "paperSummaryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Acronym" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "paperSummaryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Acronym_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperContentGrobid" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "head" TEXT,
    "head_n" TEXT,
    "para" JSONB,
    "paper_id" TEXT,
    "order_index" INTEGER,
    "paperSummaryID" UUID,
    "simplifiedText" TEXT,
    "simplifiedHead" TEXT,
    "geminiOrder" TEXT,

    CONSTRAINT "PaperContentGrobid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperParagraph" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "text" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "contentGrobidId" UUID NOT NULL,

    CONSTRAINT "PaperParagraph_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParagraphReference" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ref_key" TEXT NOT NULL,
    "ref_text" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "paragraphId" UUID NOT NULL,

    CONSTRAINT "ParagraphReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperFigures" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "figure_type" TEXT,
    "figure_id" TEXT,
    "label" TEXT,
    "head" TEXT,
    "description" TEXT,
    "coords" TEXT,
    "graphic_type" TEXT,
    "graphic_coords" TEXT,
    "extracted_image_path" TEXT,
    "page_number" INTEGER,
    "source_file" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "image_url" TEXT,
    "paper_summary_id" UUID,

    CONSTRAINT "PaperFigures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperMainStructure" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "pdf_file_path" TEXT,
    "xml_file_path" TEXT,
    "status" TEXT,

    CONSTRAINT "PaperMainStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reference" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "xml_id" TEXT,
    "doi" TEXT,
    "url" TEXT,
    "title" TEXT,
    "title_level" TEXT,
    "title_type" TEXT,
    "journal" TEXT,
    "volume" TEXT,
    "issue" TEXT,
    "page_from" TEXT,
    "page_to" TEXT,
    "page_range" TEXT,
    "publication_date" TEXT,
    "date_type" TEXT,
    "paper_summary_id" UUID NOT NULL,

    CONSTRAINT "Reference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferenceAuthor" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "reference_id" UUID NOT NULL,
    "forename" TEXT,
    "forename_type" TEXT,
    "surname" TEXT,
    "position" INTEGER,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferenceAuthor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperNotes" (
    "id" UUID NOT NULL,
    "paper_summary_id" UUID NOT NULL,
    "xml_id" TEXT,
    "place" TEXT,
    "note_number" TEXT,
    "content" TEXT,
    "references" JSONB,
    "html_content" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaperNotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrobidFigureData" (
    "id" UUID NOT NULL,
    "xml_id" TEXT,
    "figure_number" TEXT,
    "label" TEXT,
    "title" TEXT,
    "description" TEXT,
    "graphic_coords" TEXT,
    "graphic_type" TEXT,
    "has_graphic" BOOLEAN DEFAULT false,
    "order_index" INTEGER,
    "html_content" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "paper_summary_id" UUID,
    "image_url" TEXT,

    CONSTRAINT "GrobidFigureData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchQuery" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactCheckSession" (
    "id" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "keywords" TEXT[],
    "finalVerdict" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "shareableId" TEXT NOT NULL,

    CONSTRAINT "FactCheckSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactCheckPaper" (
    "id" TEXT NOT NULL,
    "factCheckSessionId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authors" TEXT[],
    "summary" TEXT,
    "published" TEXT,
    "doi" TEXT,
    "journalName" TEXT,
    "publisher" TEXT,
    "relevanceScore" DOUBLE PRECISION,
    "citedByCount" INTEGER,
    "links" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FactCheckPaper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactCheckAnalysis" (
    "id" TEXT NOT NULL,
    "factCheckPaperId" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "analysisMethod" TEXT,
    "supportLevel" TEXT,
    "confidence" DOUBLE PRECISION,
    "summary" TEXT,
    "relevantSections" JSONB,
    "keyFindings" TEXT[],
    "limitations" TEXT[],
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FactCheckAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistSignup_email_key" ON "WaitlistSignup"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");

-- CreateIndex
CREATE INDEX "idx_paper_content_order_index" ON "PaperContentGrobid"("order_index");

-- CreateIndex
CREATE INDEX "PaperParagraph_contentGrobidId_idx" ON "PaperParagraph"("contentGrobidId");

-- CreateIndex
CREATE INDEX "PaperParagraph_order_index_idx" ON "PaperParagraph"("order_index");

-- CreateIndex
CREATE INDEX "ParagraphReference_paragraphId_idx" ON "ParagraphReference"("paragraphId");

-- CreateIndex
CREATE INDEX "Reference_paper_summary_id_idx" ON "Reference"("paper_summary_id");

-- CreateIndex
CREATE INDEX "ReferenceAuthor_reference_id_idx" ON "ReferenceAuthor"("reference_id");

-- CreateIndex
CREATE INDEX "idx_paper_notes_paper_summary_id" ON "PaperNotes"("paper_summary_id");

-- CreateIndex
CREATE INDEX "idx_paper_notes_xml_id" ON "PaperNotes"("xml_id");

-- CreateIndex
CREATE INDEX "idx_grobid_figure_data_paper_summary_id" ON "GrobidFigureData"("paper_summary_id");

-- CreateIndex
CREATE INDEX "idx_grobid_figure_data_xml_id" ON "GrobidFigureData"("xml_id");

-- CreateIndex
CREATE UNIQUE INDEX "FactCheckSession_shareableId_key" ON "FactCheckSession"("shareableId");

-- CreateIndex
CREATE INDEX "FactCheckSession_shareableId_idx" ON "FactCheckSession"("shareableId");

-- CreateIndex
CREATE INDEX "FactCheckPaper_factCheckSessionId_idx" ON "FactCheckPaper"("factCheckSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "FactCheckAnalysis_factCheckPaperId_key" ON "FactCheckAnalysis"("factCheckPaperId");

-- CreateIndex
CREATE INDEX "FactCheckAnalysis_factCheckPaperId_idx" ON "FactCheckAnalysis"("factCheckPaperId");

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_paperSummaryId_fkey" FOREIGN KEY ("paperSummaryId") REFERENCES "PaperSummary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_paperSummaryId_fkey" FOREIGN KEY ("paperSummaryId") REFERENCES "PaperSummary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaperParagraph" ADD CONSTRAINT "PaperParagraph_contentGrobidId_fkey" FOREIGN KEY ("contentGrobidId") REFERENCES "PaperContentGrobid"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParagraphReference" ADD CONSTRAINT "ParagraphReference_paragraphId_fkey" FOREIGN KEY ("paragraphId") REFERENCES "PaperParagraph"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferenceAuthor" ADD CONSTRAINT "ReferenceAuthor_reference_id_fkey" FOREIGN KEY ("reference_id") REFERENCES "Reference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaperNotes" ADD CONSTRAINT "fk_paper_summary" FOREIGN KEY ("paper_summary_id") REFERENCES "PaperMainStructure"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "FactCheckPaper" ADD CONSTRAINT "FactCheckPaper_factCheckSessionId_fkey" FOREIGN KEY ("factCheckSessionId") REFERENCES "FactCheckSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactCheckAnalysis" ADD CONSTRAINT "FactCheckAnalysis_factCheckPaperId_fkey" FOREIGN KEY ("factCheckPaperId") REFERENCES "FactCheckPaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;
