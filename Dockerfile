FROM node:22-alpine

WORKDIR /app

# Install dependencies needed for node-gyp, bcrypt, and prisma
RUN apk add --no-cache python3 make g++ openssl

# Copy package files
COPY package*.json ./

# Install all dependencies (we need devDependencies like typescript and tsx to run via tsx, or we build it)
RUN npm install

# Copy source code and prisma schema
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 3001

# Command to run (using dev mode tsx for simplicity, in prod you'd compile to JS)
CMD ["npx", "tsx", "src/server.ts"]
