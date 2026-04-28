FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod ./
COPY main.go ./
RUN go mod tidy
RUN go mod download
RUN go build -o worker main.go

FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/worker .

CMD ["./worker"]
