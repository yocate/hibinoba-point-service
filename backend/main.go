package main

import (
	"log"
	"time"

	"internal-point-system/backend/db"
	"internal-point-system/backend/handlers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Connect DB
	db.Connect()

	r := gin.Default()

	// CORS for frontend
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"}, // For MVP
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.GET("/health", func(c *gin.Context) {
		c.String(200, "OK")
	})

	api := r.Group("/api")
	{
		api.GET("/users", handlers.GetUsers)
		api.POST("/users", handlers.CreateUser) // For admin/seed
		api.PUT("/users/:id", handlers.UpdateUser)
		api.DELETE("/users/:id", handlers.DeleteUser)
		api.POST("/login", handlers.Login)

		api.GET("/transactions", handlers.GetTransactions)
		api.POST("/transactions/issue", handlers.IssuePoints)
		api.POST("/transactions/transfer", handlers.TransferPoints)
	}

	log.Println("Server executing on :8080")
	r.Run(":8080")
}
