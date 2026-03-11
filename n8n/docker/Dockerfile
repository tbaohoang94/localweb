# Stage 1: Chromium und Abhaengigkeiten aus Alpine kopieren
FROM alpine:3.21 AS chromium-stage

RUN apk update && apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Stage 2: n8n-Image mit Chromium
FROM n8nio/n8n:2.9.4

USER root

# Chromium und alle benoetigten Libraries aus Stage 1
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

# Symlink damit /usr/bin/chromium konsistent verfuegbar ist
RUN ln -sf /usr/bin/chromium-browser /usr/bin/chromium

USER node

# Puppeteer soll kein eigenes Chromium herunterladen
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Externe Module fuer Code Nodes (Versionen gepinnt)
RUN npm install \
    puppeteer@^24.0.0 \
    puppeteer-core@^24.0.0 \
    apify-client@^2.11.0 \
    cheerio@^1.0.0 \
    --save
