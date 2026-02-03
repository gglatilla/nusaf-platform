-- Add CAD-specific document types to ProductDocumentType enum
-- These support the website's CAD download feature per website-design skill

-- CAD 2D formats
ALTER TYPE "ProductDocumentType" ADD VALUE IF NOT EXISTS 'CAD_2D_DXF';
ALTER TYPE "ProductDocumentType" ADD VALUE IF NOT EXISTS 'CAD_2D_DWG';
ALTER TYPE "ProductDocumentType" ADD VALUE IF NOT EXISTS 'CAD_2D_PDF';

-- CAD 3D formats
ALTER TYPE "ProductDocumentType" ADD VALUE IF NOT EXISTS 'CAD_3D_STEP';
ALTER TYPE "ProductDocumentType" ADD VALUE IF NOT EXISTS 'CAD_3D_IGES';
ALTER TYPE "ProductDocumentType" ADD VALUE IF NOT EXISTS 'CAD_3D_SAT';
ALTER TYPE "ProductDocumentType" ADD VALUE IF NOT EXISTS 'CAD_3D_PARASOLID';
ALTER TYPE "ProductDocumentType" ADD VALUE IF NOT EXISTS 'CAD_3D_SOLIDWORKS';
ALTER TYPE "ProductDocumentType" ADD VALUE IF NOT EXISTS 'CAD_3D_INVENTOR';
ALTER TYPE "ProductDocumentType" ADD VALUE IF NOT EXISTS 'CAD_3D_CATIA';
