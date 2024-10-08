FROM node:18-bullseye
MAINTAINER label="Rohan Rustagi"
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# RUN echo "TOGETHER_API_KEY=your_together_api_key_here" > .env.local (# Create a .env.local file and add the TOGETHER_API_KEY)
EXPOSE 3000
CMD ["npm", "run", "dev"]
