package handlers

import (
	"internal-point-system/backend/db"
	"internal-point-system/backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

// List all active reasons
func GetReasons(c *gin.Context) {
	rows, err := db.DB.Query("SELECT id, name, is_active, created_at FROM transaction_reasons WHERE is_active = true ORDER BY created_at ASC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var reasons []models.TransactionReason
	for rows.Next() {
		var r models.TransactionReason
		if err := rows.Scan(&r.ID, &r.Name, &r.IsActive, &r.CreatedAt); err != nil {
			continue
		}
		reasons = append(reasons, r)
	}
	c.JSON(http.StatusOK, reasons)
}

// Add a new reason (Admin only)
func CreateReason(c *gin.Context) {
	// Role check should be done in middleware or here
	role, exists := c.Get("role")
	if !exists || role.(string) != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	var req struct {
		Name string `json:"name"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name is required"})
		return
	}

	var reason models.TransactionReason
	err := db.DB.QueryRow(`
		INSERT INTO transaction_reasons (name) 
		VALUES ($1) 
		RETURNING id, name, is_active, created_at`, req.Name).
		Scan(&reason.ID, &reason.Name, &reason.IsActive, &reason.CreatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, reason)
}

// Soft delete a reason (Admin only)
func DeleteReason(c *gin.Context) {
	role, exists := c.Get("role")
	if !exists || role.(string) != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	id := c.Param("id")
	_, err := db.DB.Exec("UPDATE transaction_reasons SET is_active = false WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusOK)
}
