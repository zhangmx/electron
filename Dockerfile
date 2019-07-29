FROM balenalib/amd64-debian-node:12.6-buster-build as builder
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm i
COPY tsconfig.json webpack.config.js ./
COPY lib lib/
RUN npm run build

FROM balenalib/amd64-debian-node:12.6-buster-run
RUN \
	apt-get update && \
	apt-get install -y \
		# Electron runtime dependencies
		libasound2 \
		libgdk-pixbuf2.0-0 \
		libglib2.0-0 \
		libgtk-3-0 \
		libnss3 \
		libx11-xcb1 \
		libxss1 \
		libxtst6 && \
	rm -rf /var/lib/apt/lists/*
COPY --from=builder /usr/src/app/build /usr/lib/balena-electronjs
