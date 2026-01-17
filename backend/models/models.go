package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID `json:"id"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	Role         string    `json:"role"`
	CreatedAt    time.Time `json:"created_at"`
	Balance      int64     `json:"balance"`
	PasswordHash string    `json:"-"` // Never return password in JSON
	IsActive     bool      `json:"is_active"`
}

type Wallet struct {
	UserID    uuid.UUID `json:"user_id"`
	Balance   int64     `json:"balance"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Transaction struct {
	ID         uuid.UUID  `json:"id"`
	SenderID   *uuid.UUID `json:"sender_id"`
	ReceiverID uuid.UUID  `json:"receiver_id"`
	Amount     int        `json:"amount"`
	Type       string     `json:"type"`
	CreatedAt  time.Time  `json:"created_at"`
}
