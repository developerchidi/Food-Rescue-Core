-- CreateEnum
CREATE TYPE "FulfillmentMethod" AS ENUM ('PICKUP', 'DELIVERY');

-- AlterTable
ALTER TABLE "Donation" ADD COLUMN     "deliveryAddress" TEXT,
ADD COLUMN     "deliveryPhone" TEXT,
ADD COLUMN     "fulfillmentMethod" "FulfillmentMethod" NOT NULL DEFAULT 'PICKUP';
