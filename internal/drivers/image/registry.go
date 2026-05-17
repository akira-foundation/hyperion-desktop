package image

import (
	"context"
	"fmt"
	"sort"
	"sync"

	"hyperion-desktop/internal/domain/image"
	"hyperion-desktop/internal/ports"
)

type ProviderInfo struct {
	Name         string             `json:"name"`
	DisplayName  string             `json:"displayName"`
	Available    bool               `json:"available"`
	Reason       string             `json:"reason,omitempty"`
	Capabilities image.Capabilities `json:"capabilities"`
	Models       []image.ModelInfo  `json:"models"`
}

type Registry struct {
	mu        sync.RWMutex
	providers map[string]ports.ImageProvider
}

func NewRegistry() *Registry {
	return &Registry{providers: make(map[string]ports.ImageProvider)}
}

func (r *Registry) Register(p ports.ImageProvider) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.providers[p.Name()] = p
}

func (r *Registry) Get(name string) (ports.ImageProvider, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	p, ok := r.providers[name]
	if !ok {
		return nil, fmt.Errorf("image provider %q not registered", name)
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
