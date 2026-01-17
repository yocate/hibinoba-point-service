# Build stage
FROM golang:1.23-alpine

WORKDIR /app

# Install Air for hot reload
RUN go install github.com/cosmtrek/air@v1.51.0

COPY go.mod ./
# COPY go.sum ./
# RUN go mod download

COPY . .

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

CMD ["air", "-c", ".air.toml"]
