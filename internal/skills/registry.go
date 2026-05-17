package skills

import (
	"embed"
	"fmt"
	"io/fs"
	"strings"
	"sync"

	"hyperion-desktop/internal/domain/skill"
	"hyperion-desktop/internal/ports"
)

//go:embed all:instagram-carousel
var bundled embed.FS

type bundledSkill struct {
	meta     skill.Skill
	root     string
	systemFS fs.FS
}

func (b *bundledSkill) Meta() skill.Skill { return b.meta }

func (b *bundledSkill) SystemPrompt() string {
	data, err := fs.ReadFile(b.systemFS, b.root+"/SKILL.md")
	if err != nil {
		return ""
	}
	content := string(data)
	if idx := strings.Index(content, "---\n"); idx == 0 {
		if end := strings.Index(content[4:], "---\n"); end >= 0 {
			content = content[end+8:]
		}
	}
	return strings.TrimSpace(content)
}

type Registry struct {
	mu     sync.RWMutex
	skills map[string]*bundledSkill
}

func NewRegistry() *Registry {
	r := &Registry{skills: make(map[string]*bundledSkill)}
	r.register(&bundledSkill{
		meta: skill.Skill{
			ID:          "instagram-carousel",
			Name:        "Instagram Carousel",
			Description: "Generate an 8-slide branded IG carousel (1080x1080) from any project.",
			Category:    "Marketing",
			Tags:        []string{"carousel", "instagram", "marketing", "branding"},
		},
		root:     "instagram-carousel",
		systemFS: bundled,
	})
	return r
}

func (r *Registry) register(s *bundledSkill) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.skills[s.meta.ID] = s
}

func (r *Registry) List() []skill.Skill {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]skill.Skill, 0, len(r.skills))
	for _, s := range r.skills {
		out = append(out, s.meta)
	}
	return out
}

func (r *Registry) Get(id string) (ports.Skill, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	s, ok := r.skills[id]
	if !ok {
		return nil, fmt.Errorf("skill %q not found", id)
	}
	return s, nil
}
