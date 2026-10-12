package repository

import (
	"context"

	"github.com/swellwatch/backend/internal/domain"
)

type SpotRepository interface {
	GetAll(ctx context.Context) ([]domain.Spot, error)
	GetByID(ctx context.Context, id string) (*domain.Spot, bool, error)
	SaveAll(ctx context.Context, spots []domain.Spot) error
}
