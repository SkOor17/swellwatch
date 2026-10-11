package cache

import (
	"sync"
	"time"
)

type cacheItem[T any] struct {
	value     T
	expiresAt time.Time
}

type MemoryCache[T any] struct {
	mu    sync.RWMutex
	items map[string]cacheItem[T]
}

func NewMemoryCache[T any]() *MemoryCache[T] {
	return &MemoryCache[T]{
		items: make(map[string]cacheItem[T]),
	}
}

func (c *MemoryCache[T]) Set(key string, value T, ttl time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.items[key] = cacheItem[T]{
		value:     value,
		expiresAt: time.Now().Add(ttl),
	}
}

func (c *MemoryCache[T]) Get(key string) (T, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	item, exists := c.items[key]
	if !exists {
		var zero T
		return zero, false
	}

	if time.Now().After(item.expiresAt) {
		var zero T
		return zero, false
	}

	return item.value, true
}

func (c *MemoryCache[T]) GetStale(key string) (T, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	item, exists := c.items[key]
	if !exists {
		var zero T
		return zero, false
	}

	return item.value, true
}

func (c *MemoryCache[T]) Delete(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.items, key)
}
