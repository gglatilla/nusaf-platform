-- CreateEnum
CREATE TYPE "FulfillmentPolicy" AS ENUM ('SHIP_PARTIAL', 'SHIP_COMPLETE', 'SALES_DECISION');

-- AlterTable: Add fulfillment_policy to companies
ALTER TABLE "companies" ADD COLUMN "fulfillment_policy" "FulfillmentPolicy" NOT NULL DEFAULT 'SHIP_COMPLETE';

-- AlterTable: Add fulfillment_policy_override to sales_orders
ALTER TABLE "sales_orders" ADD COLUMN "fulfillment_policy_override" "FulfillmentPolicy";
