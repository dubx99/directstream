FROM node:14-buster

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    wget \
    xz-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install FFMPEG
RUN wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz \
    && tar -xf ffmpeg-release-amd64-static.tar.xz \
    && cd ffmpeg-6.0-amd64-static/ \
    && mv ffmpeg /usr/bin/ \
    && mv ffprobe /usr/bin/

# Install Streamlink DRM
RUN pip3 install --user -U git+https://github.com/ImAleeexx/streamlink-drm

# Install Node.js dependencies
COPY package.json .
RUN npm install

# Copy application files
COPY . .

# Expose the server port
EXPOSE 8080

# Start the server
CMD [ "node", "server.js" ]
