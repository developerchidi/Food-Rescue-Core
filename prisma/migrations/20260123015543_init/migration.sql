-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('DONOR', 'RECEIVER', 'ADMIN');

-- CreateEnum
CREATE TYPE "FoodStatus" AS ENUM ('AVAILABLE', 'PENDING', 'TAKEN', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('REQUESTED', 'APPROVED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FoodType" AS ENUM ('MYSTERY_BOX', 'INDIVIDUAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'RECEIVER',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodPost" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "type" "FoodType" NOT NULL DEFAULT 'INDIVIDUAL',
    "originalPrice" DOUBLE PRECISION,
    "rescuePrice" DOUBLE PRECISION,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "status" "FoodStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" "DonationStatus" NOT NULL DEFAULT 'REQUESTED',
    "qrCode" TEXT,
    "pickupTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Donation_qrCode_key" ON "Donation"("qrCode");

-- AddForeignKey
ALTER TABLE "FoodPost" ADD CONSTRAINT "FoodPost_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FoodPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
