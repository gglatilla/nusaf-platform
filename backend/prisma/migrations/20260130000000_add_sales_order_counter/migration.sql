-- CreateTable
CREATE TABLE "sales_order_counter" (
    "id" TEXT NOT NULL DEFAULT 'order_counter',
    "year" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sales_order_counter_pkey" PRIMARY KEY ("id")
);
