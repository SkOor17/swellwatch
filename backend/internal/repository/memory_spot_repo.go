package repository

import (
	"context"
	"strings"
	"sync"

	"github.com/swellwatch/backend/internal/domain"
)

type MemorySpotRepository struct {
	mu    sync.RWMutex
	spots map[string]domain.Spot
}

func NewMemorySpotRepository() *MemorySpotRepository {
	return &MemorySpotRepository{
		spots: make(map[string]domain.Spot),
	}
}

func (r *MemorySpotRepository) GetAll(ctx context.Context) ([]domain.Spot, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	result := make([]domain.Spot, 0, len(r.spots))
	for _, sp := range r.spots {
		result = append(result, sp)
	}
	return result, nil
}

func (r *MemorySpotRepository) GetByID(ctx context.Context, id string) (*domain.Spot, bool, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	sp, found := r.spots[strings.ToLower(id)]
	if !found {
		return nil, false, nil
	}
	res := sp
	return &res, true, nil
}

func (r *MemorySpotRepository) SaveAll(ctx context.Context, spots []domain.Spot) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for _, sp := range spots {
		r.spots[strings.ToLower(sp.ID)] = sp
	}
	return nil
}
