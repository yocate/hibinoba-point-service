package handlers

import (
	"database/sql"
	"internal-point-system/backend/db"
	"net/http"

	"github.com/gin-gonic/gin"
)

// External POS Payment (Deduct Points)
func ProcessPayment(c *gin.Context) {
	var req struct {
		UserID      string `json:"user_id"`
		Amount      int    `json:"amount"`
		Description string `json:"description"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Amount must be positive"})
		return
	}

	// Start Transaction
	tx, err := db.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 1. Check Balance
	var balance int64
	err = tx.QueryRow("SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE", req.UserID).Scan(&balance)
	if err == sql.ErrNoRows {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	} else if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if balance < int64(req.Amount) {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient balance"})
		return
	}

	// 2. Deduct Points
	_, err = tx.Exec("UPDATE wallets SET balance = balance - $1 WHERE user_id = $2", req.Amount, req.UserID)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update balance"})
		return
	}

	// 3. Record Transaction
	// Payment is outgoing, so verify how to record sender/receiver.
	// For Payment: Sender = User, Receiver = NULL (System/Burn) or Special POS Account?
	// Spec: Deduct from user. User is sender. Receiver is NULL (System).
	// Type: 'payment'

	description := req.Description
	if description == "" {
		description = "POS Payment"
	}

	_, err = tx.Exec(`
		INSERT INTO transactions (sender_id, amount, type, description)
		VALUES ($1, $2, 'payment', $3)
	`, req.UserID, req.Amount, description)

	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to record transaction"})
		return
	}

	// Commit
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Payment successful",
		"balance": balance - int64(req.Amount),
	})
}
