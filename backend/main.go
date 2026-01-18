package main

import (
	"log"
	"time"

	"internal-point-system/backend/auth"
	"internal-point-system/backend/db"
	"internal-point-system/backend/handlers"
	"internal-point-system/backend/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Connect DB
	db.Connect()

	r := gin.Default()

	// CORS for frontend
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000"}, // Restrict to frontend dev ports
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"}, // Added Authorization
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.GET("/health", func(c *gin.Context) {
		c.String(200, "OK")
	})

	api := r.Group("/api")
	{
		// Public
		api.POST("/login", handlers.Login)
		api.POST("/users", handlers.CreateUser) // Seed/Signup (Maybe protect in real app)

		// Protected
		protected := api.Group("/")
		protected.Use(auth.AuthMiddleware())
		{
			protected.GET("/users", handlers.GetUsers)
			protected.GET("/users/:id", handlers.GetUser)
			protected.PUT("/users/:id", handlers.UpdateUser)
			protected.DELETE("/users/:id", handlers.DeleteUser)

			protected.GET("/transactions", handlers.GetTransactions)
			protected.POST("/transactions/issue", handlers.IssuePoints)
			protected.POST("/transactions/transfer", handlers.TransferPoints)

			protected.GET("/reasons", handlers.GetReasons)
			protected.POST("/reasons", handlers.CreateReason)
			protected.DELETE("/reasons/:id", handlers.DeleteReason)

			protected.GET("/stats", handlers.GetSystemStats)
		}

		// External Systems (POS)
		external := api.Group("/external")
		external.Use(middleware.APIKeyAuth()) // Removed auth import check, assuming needed
		{
			external.POST("/payment", handlers.ProcessPayment)
		}
	}

	log.Println("Server executing on :8080")
	r.Run(":8080")
}
