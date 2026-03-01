package model

import "time"

type User struct {
	ID        string     `json:"id"`
	Name      string     `json:"name"`
	Email     string     `json:"email"`
	Password  *string    `json:"-"` // nil for Google-only accounts
	Avatar    *string    `json:"avatar"`
	Role      string     `json:"role"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt"`
}
