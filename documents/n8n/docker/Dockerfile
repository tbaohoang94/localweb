# Stage 1: Install Chromium and dependencies in a regular Alpine image
FROM alpine:3.22 AS chromium-stage

RUN apk update && apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Stage 2: Build final n8n image with Chromium copied in
FROM n8nio/n8n:latest

USER root

# Copy Chromium and all required libraries from the Alpine stage
COPY --from=chromium-stage /usr/bin/chromium-browser /usr/bin/chromium-browser
COPY --from=chromium-stage /usr/lib/chromium/ /usr/lib/chromium/
COPY --from=chromium-stage /usr/lib/libfreetype* /usr/lib/
COPY --from=chromium-stage /usr/lib/libharfbuzz* /usr/lib/
COPY --from=chromium-stage /usr/lib/libnss* /usr/lib/
COPY --from=chromium-stage /usr/lib/libnspr* /usr/lib/
COPY --from=chromium-stage /usr/lib/libsmime* /usr/lib/
COPY --from=chromium-stage /usr/lib/libssl3* /usr/lib/
COPY --from=chromium-stage /usr/lib/libplc4* /usr/lib/
COPY --from=chromium-stage /usr/lib/libplds4* /usr/lib/
COPY --from=chromium-stage /usr/lib/libglib* /usr/lib/
COPY --from=chromium-stage /usr/lib/libgobject* /usr/lib/
COPY --from=chromium-stage /usr/lib/libgio* /usr/lib/
COPY --from=chromium-stage /usr/lib/libgmodule* /usr/lib/
COPY --from=chromium-stage /usr/lib/libatk* /usr/lib/
COPY --from=chromium-stage /usr/lib/libpango* /usr/lib/
COPY --from=chromium-stage /usr/lib/libcairo* /usr/lib/
COPY --from=chromium-stage /usr/lib/libgdk_pixbuf* /usr/lib/
COPY --from=chromium-stage /usr/lib/libgtk* /usr/lib/
COPY --from=chromium-stage /usr/lib/libX* /usr/lib/
COPY --from=chromium-stage /usr/lib/libxcb* /usr/lib/
COPY --from=chromium-stage /usr/lib/libxkb* /usr/lib/
COPY --from=chromium-stage /usr/lib/libdrm* /usr/lib/
COPY --from=chromium-stage /usr/lib/libgbm* /usr/lib/
COPY --from=chromium-stage /usr/lib/libwayland* /usr/lib/
COPY --from=chromium-stage /usr/lib/libffi* /usr/lib/
COPY --from=chromium-stage /usr/lib/libintl* /usr/lib/
COPY --from=chromium-stage /usr/lib/libpng* /usr/lib/
COPY --from=chromium-stage /usr/lib/libpixman* /usr/lib/
COPY --from=chromium-stage /usr/lib/libfontconfig* /usr/lib/
COPY --from=chromium-stage /usr/lib/libdbus* /usr/lib/
COPY --from=chromium-stage /usr/lib/libexpat* /usr/lib/
COPY --from=chromium-stage /usr/lib/libbrotli* /usr/lib/
COPY --from=chromium-stage /usr/lib/libbz2* /usr/lib/
COPY --from=chromium-stage /usr/share/fonts/ /usr/share/fonts/
COPY --from=chromium-stage /etc/fonts/ /etc/fonts/

RUN ln -sf /usr/bin/chromium-browser /usr/bin/chromium

USER node

# Install Puppeteer and external modules for Code nodes
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
RUN npm install puppeteer puppeteer-core apify-client cheerio --save
