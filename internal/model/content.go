package model

import "time"

type Content struct {
	ID               string     `json:"id"`
	Title            string     `json:"title"`
	Slug             string     `json:"slug"`
	Type             string     `json:"type"`
	Status           string     `json:"status"`
	Body             string     `json:"body"`
	BodyHtml         string     `json:"bodyHtml"`
	AuthorID         string     `json:"authorId"`
	AuthorName       string     `json:"authorName"`
	FeaturedImageURL *string    `json:"featuredImageUrl"`
	PublishedAt      *time.Time `json:"publishedAt"`
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`
}

type ContentListItem struct {
	ID               string     `json:"id"`
	Title            string     `json:"title"`
	Slug             string     `json:"slug"`
	Type             string     `json:"type"`
	Status           string     `json:"status"`
	AuthorID         string     `json:"authorId"`
	AuthorName       string     `json:"authorName"`
	FeaturedImageURL *string    `json:"featuredImageUrl"`
	PublishedAt      *time.Time `json:"publishedAt"`
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`
}

type ContentListParams struct {
	Page   int
	Limit  int
	Type   string
	Status string
	Search string
}

type PaginatedResponse[T any] struct {
	Data       []T `json:"data"`
	Total      int `json:"total"`
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	TotalPages int `json:"totalPages"`
}

type ContentCreateInput struct {
	Title            string  `json:"title"`
	Slug             string  `json:"slug"`
	Type             string  `json:"type"`
	Status           string  `json:"status"`
	Body             string  `json:"body"`
	BodyHtml         string  `json:"bodyHtml"`
	FeaturedImageURL *string `json:"featuredImageUrl"`
	PublishedAt      *string `json:"publishedAt"` // ISO string, converted to time.Time in store
}

type ContentUpdateInput = ContentCreateInput
