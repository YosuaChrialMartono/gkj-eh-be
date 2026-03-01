package model

type PelayanRole struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Order int    `json:"order"`
}

type PelayanRoleInput struct {
	Name  string `json:"name"`
	Order *int   `json:"order"`
}

type PelayanPerson struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type PelayanService struct {
	ID      string  `json:"id"`
	Date    string  `json:"date"` // "YYYY-MM-DD"
	Label   *string `json:"label"`
	IsExtra bool    `json:"isExtra"`
}

type PelayanServiceInput struct {
	Date    string  `json:"date"`
	Label   *string `json:"label"`
	IsExtra *bool   `json:"isExtra"`
}

type PelayanAssignment struct {
	ID          string `json:"id"`
	ServiceID   string `json:"serviceId"`
	RoleID      string `json:"roleId"`
	PelayanName string `json:"pelayanName"`
}

type PelayanAssignmentInput struct {
	ServiceID   string `json:"serviceId"`
	RoleID      string `json:"roleId"`
	PelayanName string `json:"pelayanName"`
}
