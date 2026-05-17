package ai

import (
	"fmt"
	"sync"

	"hyperion-desktop/internal/ports"
)

type Registry struct {
	mu        sync.RWMutex
	providers map[string]ports.AIProvider
}

func NewRegistry() *Registry {
	return &Registry{providers: make(map[string]ports.AIProvider)}
}

func (r *Registry) Register(p ports.AIProvider) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.providers[p.Name()] = p
}

func (r *Registry) Get(name string) (ports.AIProvider, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	p, ok := r.providers[name]
	if !ok {
		return nil, fmt.Errorf("ai provider %q not registered", name)
	}
	return p, nil
}

func (r *Registry) Names() []string {
	r.mu.RLock()
	defer r.mu.RUnlock()
	names := make([]string, 0, len(r.providers))
	for n := range r.providers {
		names = append(names, n)
	}
	return names
}
