package handlers

import (
	"database/sql"
	"net/http"

	"internal-point-system/backend/db"
	"internal-point-system/backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// Helper to get transaction history
func GetTransactions(c *gin.Context) {
	// For MVP, get all transactions for current user?
	// But we don't have auth middleware yet.
	// Let's accept user_id as query param for MVP verification or header.
	userIDStr := c.Query("user_id")
	if userIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id required"})
		return
	}

	rows, err := db.DB.Query(`
		SELECT id, sender_id, receiver_id, amount, type, created_at 
		FROM transactions 
		WHERE sender_id = $1 OR receiver_id = $1 
		ORDER BY created_at DESC`, userIDStr)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var txs []models.Transaction
	for rows.Next() {
		var tx models.Transaction
		// sender_id can be null
		var senderID sql.NullString // UUID is string in driver? or use uuid package integration
		// lib/pq handles UUID as string usually or []byte

		if err := rows.Scan(&tx.ID, &senderID, &tx.ReceiverID, &tx.Amount, &tx.Type, &tx.CreatedAt); err != nil {
			continue
		}
		if senderID.Valid {
			uid, _ := uuid.Parse(senderID.String)
			tx.SenderID = &uid
		}
		txs = append(txs, tx)
	}
	c.JSON(http.StatusOK, txs)
}

// Issue points (Admin)
func IssuePoints(c *gin.Context) {
	var req struct {
		SenderID   string `json:"sender_id"` // Optional: Admin ID
		ReceiverID string `json:"receiver_id"`
		Amount     int    `json:"amount"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Amount must be positive"})
		return
	}

	tx, err := db.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Update Wallet
	_, err = tx.Exec(`
		INSERT INTO wallets (user_id, balance) VALUES ($1, $2)
		ON CONFLICT (user_id) DO UPDATE SET balance = wallets.balance + $2
	`, req.ReceiverID, req.Amount)

	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update wallet: " + err.Error()})
		return
	}

	// Create Transaction
	// If sender_id is provided, use it. Otherwise null.
	var errTx error
	if req.SenderID != "" {
		_, errTx = tx.Exec(`
			INSERT INTO transactions (sender_id, receiver_id, amount, type)
			VALUES ($1, $2, $3, 'issue')
		`, req.SenderID, req.ReceiverID, req.Amount)
	} else {
		_, errTx = tx.Exec(`
			INSERT INTO transactions (receiver_id, amount, type)
			VALUES ($1, $2, 'issue')
		`, req.ReceiverID, req.Amount)
	}

	if errTx != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to record transaction"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "Points issued successfully"})
}

// Transfer points (User)
func TransferPoints(c *gin.Context) {
	var req struct {
		SenderID   string `json:"sender_id"` // In real app, from Auth context
		ReceiverID string `json:"receiver_id"`
		Amount     int    `json:"amount"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Amount must be positive"})
		return
	}

	if req.SenderID == req.ReceiverID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot transfer to self"})
		return
	}

	tx, err := db.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Check Balance
	var balance int64
	err = tx.QueryRow("SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE", req.SenderID).Scan(&balance)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Sender wallet not found"})
		return
	}
	if balance < int64(req.Amount) {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient balance"})
		return
	}

	// Deduct
	_, err = tx.Exec("UPDATE wallets SET balance = balance - $1 WHERE user_id = $2", req.Amount, req.SenderID)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to deduct funds"})
		return
	}

	// Credit
	_, err = tx.Exec(`
		INSERT INTO wallets (user_id, balance) VALUES ($1, $2)
		ON CONFLICT (user_id) DO UPDATE SET balance = wallets.balance + $2
	`, req.ReceiverID, req.Amount)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to credit funds"})
		return
	}

	// Log Transaction
	_, err = tx.Exec(`
		INSERT INTO transactions (sender_id, receiver_id, amount, type)
		VALUES ($1, $2, $3, 'transfer')
	`, req.SenderID, req.ReceiverID, req.Amount)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to log transaction"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "Transfer successful"})
}

func GetUsers(c *gin.Context) {
	rows, err := db.DB.Query(`
		SELECT u.id, u.name, u.email, u.role, u.created_at, u.is_active, COALESCE(w.balance, 0)
		FROM users u
		LEFT JOIN wallets w ON u.id = w.user_id
		ORDER BY u.created_at DESC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.CreatedAt, &u.IsActive, &u.Balance); err != nil {
			continue
		}
		users = append(users, u)
	}
	c.JSON(http.StatusOK, users)
}

func CreateUser(c *gin.Context) {
	var req struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Role     string `json:"role"`
		Password string `json:"password"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validation
	if req.Name == "" || req.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name and Email are required"})
		return
	}
	if req.Role != "user" && req.Role != "admin" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Role must be 'user' or 'admin'"})
		return
	}

	// Hash Password
	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	var user models.User
	// Insert User
	err = db.DB.QueryRow(`
		INSERT INTO users (name, email, role, password_hash, is_active) 
		VALUES ($1, $2, $3, $4, $5) 
		RETURNING id, name, email, role, created_at, is_active`,
		req.Name, req.Email, req.Role, string(hashed), true).
		Scan(&user.ID, &user.Name, &user.Email, &user.Role, &user.CreatedAt, &user.IsActive)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Create empty wallet
	_, err = db.DB.Exec("INSERT INTO wallets (user_id, balance) VALUES ($1, 0)", user.ID)
	if err != nil {
		// Cleanup user if wallet creation fails? For MVP, skip complex rollback
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create wallet"})
		return
	}

	user.Balance = 0
	c.JSON(http.StatusCreated, user)
}

func UpdateUser(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Role     string `json:"role"`     // Added Role
		Password string `json:"password"` // Optional
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validation
	if req.Name == "" || req.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name and Email are required"})
		return
	}
	if req.Role != "user" && req.Role != "admin" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Role must be 'user' or 'admin'"})
		return
	}

	// Build Update Query
	// Simple approach: Update everything provided.
	// For password, only update if not empty.

	if req.Password != "" {
		hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}
		_, err = db.DB.Exec("UPDATE users SET name=$1, email=$2, role=$3, password_hash=$4 WHERE id=$5", req.Name, req.Email, req.Role, string(hashed), id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	} else {
		_, err := db.DB.Exec("UPDATE users SET name=$1, email=$2, role=$3 WHERE id=$4", req.Name, req.Email, req.Role, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	c.Status(http.StatusOK)
}

func DeleteUser(c *gin.Context) {
	id := c.Param("id")
	// Logical Delete
	_, err := db.DB.Exec("UPDATE users SET is_active = false WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusOK)
}

func Login(c *gin.Context) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	var passwordHash string

	err := db.DB.QueryRow(`
		SELECT id, name, email, role, password_hash, is_active, created_at 
		FROM users 
		WHERE email = $1`, req.Email).
		Scan(&user.ID, &user.Name, &user.Email, &user.Role, &passwordHash, &user.IsActive, &user.CreatedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if !user.IsActive {
		c.JSON(http.StatusForbidden, gin.H{"error": "Account is disabled"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// For MVP, just return user info.
	// In production, issue JWT here.
	c.JSON(http.StatusOK, user)
}
