package ai

import (
	"context"
	"fmt"
	"sort"
	"sync"

	"hyperion-desktop/internal/domain/ai"
	"hyperion-desktop/internal/ports"
)

type ProviderInfo struct {
	Name         string          `json:"name"`
	DisplayName  string          `json:"displayName"`
	Available    bool            `json:"available"`
	Reason       string          `json:"reason,omitempty"`
	Capabilities ai.Capabilities `json:"capabilities"`
	Models       []ai.ModelInfo  `json:"models"`
}

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

func (r *Registry) List(ctx context.Context) []ProviderInfo {
	r.mu.RLock()
	defer r.mu.RUnlock()

	out := make([]ProviderInfo, 0, len(r.providers))
	for _, p := range r.providers {
		info := ProviderInfo{
			Name:         p.Name(),
			DisplayName:  p.DisplayName(),
			Capabilities: p.Capabilities(),
		}
		if err := p.IsAvailable(ctx); err != nil {
			info.Available = false
			info.Reason = err.Error()
		} else {
			info.Available = true
		}
		if models, err := p.Models(ctx); err == nil {
			info.Models = models
		}
		out = append(out, info)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Name < out[j].Name })
	return out
}
