package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	apihttp "github.com/swellwatch/backend/internal/transport/http"
)

func main() {
	r := apihttp.SetupRouter()
	port := "8080"
	server := &http.Server{
		Addr:              ":" + port,
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	fmt.Printf("Starting server on port %s...\n", port)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server failed to start: %v", err)
	}
}
